/**
 * TubeMap Engine v1.6: Main Orchestrator
 * Execution of Steps 1-9 with strict validation and no guessing.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../supabaseClient';
import { YouTubeCollector } from './YouTubeCollector';
import { KakaoMatcher, KakaoPlace } from './KakaoMatcher';
import { normalizeMediaName } from '../utils/media';
import { SeedGenerator } from './SeedGenerator';
import { VideoFilter } from './VideoFilter';
import { DescriptionGate } from './DescriptionGate';
import { CONFIG } from './config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const OFFLINE_FILE_PATH = path.join(process.cwd(), 'src/data/offline_places.json');

export class TubeMapEngine {
    private youtube: YouTubeCollector;
    private kakao: KakaoMatcher;
    private db: SupabaseClient | null;

    constructor() {
        this.youtube = new YouTubeCollector();
        this.kakao = new KakaoMatcher();
        this.db = getSupabaseClient();
    }

    // Helper: Save to Offline JSON
    private async saveToOfflineFile(placeData: any) {
        try {
            let existing: any[] = [];
            if (fs.existsSync(OFFLINE_FILE_PATH)) {
                const raw = fs.readFileSync(OFFLINE_FILE_PATH, 'utf-8');
                try { existing = JSON.parse(raw); } catch (e) { }
            }

            // Deduplicate by kakao_place_id
            const idx = existing.findIndex((p: any) => p.kakao_place_id === placeData.kakao_place_id);
            if (idx >= 0) {
                existing[idx] = { ...existing[idx], ...placeData }; // Update
            } else {
                existing.push(placeData); // Insert
            }

            fs.writeFileSync(OFFLINE_FILE_PATH, JSON.stringify(existing, null, 2), 'utf-8');
            console.log(`[Engine v1.6] 💾 Saved OFFLINE: ${placeData.name}`);
        } catch (e) {
            console.error(`[Engine v1.6] ❌ Offline Save Failed:`, e);
        }
    }

    /**
     * MAIN ENTRY: Process a Keyword or Channel Loop
     * Now supports auto-seed generation if no argument provided.
     */
    async discoverAndProcess(targetOverride?: string): Promise<void> {
        let searchQuery = targetOverride;
        let seedType = 'MANUAL';
        let seedSource = targetOverride;

        if (!targetOverride) {
            const seed = SeedGenerator.generateSeed();
            searchQuery = seed.query;
            seedType = seed.type;
            seedSource = seed.source;
            console.log(`[Engine v1.6] 🎲 Generated Seed: "${searchQuery}" (Type: ${seedType})`);
        } else {
            console.log(`[Engine v1.6] 🎯 Manual Target: "${searchQuery}"`);
        }

        // Step 1: Search
        // We pass the full query. YouTubeCollector should handle it.
        // Spec: order=viewCount, type=video, etc. handled in YouTubeCollector or default.
        const videoIds = await this.youtube.searchVideos(searchQuery!, 20); // Limit 20 (Increased for Batch Test)
        console.log(`[Engine v1.6] Found ${videoIds.length} candidate videos for "${searchQuery}".`);

        for (const videoId of videoIds) {
            await this.processSingleVideo(videoId, seedSource || "Unknown");
        }
    }

    /**
     * CORE PIPELINE (Step 2-9)
     */
    async processSingleVideo(videoId: string, sourceLabel: string) {
        if (!this.db) {
            console.error("[Engine v1.6] DB Connection Failed");
            return;
        }

        console.log(`\n>>> Processing Video: ${videoId}`);

        // STEP A: Check Idempotency (processed_videos)
        const { data: existing } = await this.db
            .from('processed_videos')
            .select('status')
            .eq('video_id', videoId)
            .single();

        if (existing && existing.status === 'processed') {
            console.log(`[Engine v1.6] SKIP: Already processed.`);
            return;
        }

        try {
            // STEP 1: Video Details
            // Still need to fetch details to get description
            const videoInfo = await this.youtube.getVideoDetails(videoId);
            if (!videoInfo) throw new Error("Video Details Fetch Failed");

            // [NEW] Strict Channel Filter (MVP 2.0)
            const isApprovedChannel = CONFIG.YOUTUBE_CHANNELS.some(c =>
                videoInfo.channelTitle.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(videoInfo.channelTitle.toLowerCase())
            );

            if (!isApprovedChannel) {
                console.log(`[Engine v1.6] SKIP: Channel "${videoInfo.channelTitle}" not in approved list.`);
                await this.db.from('processed_videos').upsert({
                    video_id: videoId,
                    status: 'skipped',
                    fail_reason: 'CHANNEL_NOT_IN_LIST'
                });
                return;
            }

            // STEP B: Description Gate (Strict Parsing)
            const parsed = DescriptionGate.parseDescription(videoInfo.description);

            if (!parsed.pass || !parsed.storeName || !parsed.regionHint) {
                console.log(`[Engine v1.6] GATE BLOCKED: No Store+Region in Description.`);
                // Save as skipped
                await this.db.from('processed_videos').upsert({
                    video_id: videoId,
                    status: 'skipped',
                    fail_reason: 'DESC_NO_STORE_OR_REGION'
                });
                return;
            }

            console.log(`[Engine v1.6] GATE PASS: Name="${parsed.storeName}" Region="${parsed.regionHint}"`);

            // [New v3.2] Clean names for search (remove emojis/symbols)
            const cleanStoreName = parsed.storeName!.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, "").trim();
            const cleanRegionHint = parsed.regionHint!.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, "").trim();

            // STEP C: Kakao Match (Query = Name + RegionHint)
            const matchVal = await this.kakao.searchPlace(cleanStoreName, cleanRegionHint, "");

            if (!matchVal) {
                throw new Error("Kakao Match Failed");
            }

            const place = matchVal.place as KakaoPlace;

            // STEP 6: Image Validation (Strict HEAD Check)
            const thumbUrl = videoInfo.thumbnailUrl;
            let imageState = 'pending';
            try {
                const headRes = await axios.head(thumbUrl);
                if (headRes.status === 200) imageState = 'approved';
            } catch (e) {
                console.warn(`[Engine v1.6] Thumbnail Unreachable: ${thumbUrl}`);
            }

            // STEP 8: DB Save (Upsert)
            const placeData = {
                kakao_place_id: place.id,
                name_official: place.place_name,
                name: place.place_name,
                category: place.category_name, // Whole path: "음식점 > 한식 > 국밥 > 순대국"
                // menu_primary: "", // Removed: Column missing in DB schema
                address: place.address_name,
                road_address: place.road_address_name,
                lat: parseFloat(place.y),
                lng: parseFloat(place.x),
                phone: place.phone,
                channel_title: videoInfo.channelTitle,
                media_label: normalizeMediaName(sourceLabel.split('|')[0]?.trim()),
                video_id: videoId,
                video_url: `https://www.youtube.com/watch?v=${videoId}`,
                published_at: videoInfo.publishedAt,

                description: videoInfo.description.substring(0, 200),
                best_comment: "", // No comment fetching in MVP
                best_comment_like_count: 0,

                image_state: imageState,
                image_url: thumbUrl,
                image_type: 'youtube_thumbnail'
            };

            let savedPlace: any = null;

            // Try DB First
            try {
                const { data, error } = await this.db.from('places').upsert(placeData, { onConflict: 'kakao_place_id' }).select().single();
                if (error) throw error;
                savedPlace = data;
                console.log(`[Engine v1.6] SUCCESS: Saved ${place.place_name} (Video: ${videoId})`);
            } catch (dbError: any) {
                console.warn(`[Engine v1.6] ⚠️ DB Error (${dbError.message}). Switch to OFFLINE mode.`);
                const offlineData = { ...placeData, id: place.id, is_offline: true };
                await this.saveToOfflineFile(offlineData);
                savedPlace = offlineData;
            }

            // Save 'images'
            if (savedPlace && !savedPlace.is_offline && imageState === 'approved') {
                await this.db.from('images').upsert({
                    place_id: savedPlace.id,
                    image_type: 'youtube_thumbnail',
                    url: thumbUrl,
                    status: 'approved',
                    source_video_id: videoId
                }, { onConflict: 'place_id, image_type' });
            }

            // Save 'processed_videos' (Success)
            if (savedPlace && !savedPlace.is_offline) {
                await this.db.from('processed_videos').upsert({
                    video_id: videoId,
                    status: 'processed'
                });
            }

        } catch (error: any) {
            console.error(`[Engine v1.6] FAILED ${videoId}: ${error.message}`);
            // Save 'processed_videos' (Failed)
            if (this.db) {
                await this.db.from('processed_videos').upsert({
                    video_id: videoId,
                    status: 'failed',
                    fail_reason: error.message
                });
            }
        }
    }
}
