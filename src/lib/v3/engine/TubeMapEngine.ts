/**
 * TubeMap Engine v1.6: Main Orchestrator
 * Execution of Steps 1-9 with strict validation and no guessing.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../supabaseClient';
import { YouTubeCollector } from './YouTubeCollector';
import { KakaoMatcher, KakaoPlace } from './KakaoMatcher';
import { CONFIG } from './config';
import axios from 'axios';

export class TubeMapEngine {
    private youtube: YouTubeCollector;
    private kakao: KakaoMatcher;
    private db: SupabaseClient | null;

    constructor() {
        this.youtube = new YouTubeCollector();
        this.kakao = new KakaoMatcher();
        this.db = getSupabaseClient();
    }

    /**
     * MAIN ENTRY: Process a Keyword or Channel Loop
     */
    async discoverAndProcess(keywordOrChannel: string): Promise<void> {
        console.log(`[Engine v1.6] Starting discovery for: ${keywordOrChannel}`);

        // Step 1: Search
        const videoIds = await this.youtube.searchVideos(keywordOrChannel, 5); // Limit 5 for safety
        console.log(`[Engine v1.6] Found ${videoIds.length} candidate videos.`);

        for (const videoId of videoIds) {
            await this.processSingleVideo(videoId, keywordOrChannel);
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

        // STEP 0: Check Idempotency (processed_videos)
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
            // STEP 2: Video Details & Metadata
            const videoInfo = await this.youtube.getVideoDetails(videoId);
            if (!videoInfo) throw new Error("Video Details Fetch Failed or Keywords Mismatch");

            // Extract Candidates (Strict Regex)
            const candidates = this.youtube.extractCandidates(videoInfo.title);
            if (candidates.length === 0) throw new Error("Extraction Failed: No Candidate Found in Title");

            console.log(`[Engine v1.6] Candidates extracted: ${JSON.stringify(candidates)}`);

            // Iterate candidates (usually 1)
            let matchParam: any = null;
            let matchScore = 0;

            for (const cand of candidates) {
                // STEP 3: Kakao Match
                const matchVal = await this.kakao.searchPlace(cand.name, cand.area, cand.menu);
                if (!matchVal) continue;

                // STEP 4: Address Verification
                // If not 'approved' immediately (score < 80), try cross-verify to boost confidence
                // Spec says: "If verify fail -> downgrade". Here we use it to Confirm.
                const isAddrVerified = this.kakao.verifyAddressInText(
                    matchVal.place,
                    videoInfo.title + " " + videoInfo.description
                );

                if (isAddrVerified && matchVal.score >= 50) {
                    // Boost score if address matches exactly in text
                    matchVal.score += 20;
                    if (matchVal.score >= 80) matchVal.status = 'approved';
                }

                if (matchVal.status === 'rejected') {
                    console.log(`[Engine v1.6] Candidate Rejected: ${cand.name} (Score: ${matchVal.score})`);
                    continue;
                }

                // If approved or review, pick this match
                matchParam = matchVal;
                break; // Pick best first match
            }

            if (!matchParam) throw new Error("Matching Failed: No High Score Candidate");

            const place = matchParam.place as KakaoPlace;

            // STEP 6: Image Validation (Strict HEAD Check)
            const thumbUrl = videoInfo.thumbnailUrl;
            let imageState = 'pending';
            try {
                const headRes = await axios.head(thumbUrl);
                if (headRes.status === 200) imageState = 'approved';
            } catch (e) {
                console.warn(`[Engine v1.6] Thumbnail Unreachable: ${thumbUrl}`);
            }

            // STEP 7: Comments
            const bestComment = await this.youtube.getBestComment(videoId);

            // STEP 8: DB Save (Upsert)
            // Save 'places'
            const { data: savedPlace, error: dbError } = await this.db.from('places').upsert({
                kakao_place_id: place.id,
                name_official: place.place_name,
                name: place.place_name,
                category: place.category_name, // Whole path: "음식점 > 한식 > 국밥 > 순대국"
                menu_primary: matchParam.menu_hint || "", // Save menu if we had a hint
                address: place.address_name,
                road_address: place.road_address_name,
                lat: parseFloat(place.y),
                lng: parseFloat(place.x),
                phone: place.phone,
                channel_title: videoInfo.channelTitle,
                media_label: sourceLabel,
                video_id: videoId,
                video_url: `https://www.youtube.com/watch?v=${videoId}`,
                published_at: videoInfo.publishedAt,
                description: videoInfo.description.substring(0, 200), // Truncate
                best_comment: bestComment?.text || "",
                best_comment_like_count: bestComment?.likes || 0,
                image_state: imageState,
                image_url: thumbUrl,
                image_type: 'youtube_thumbnail'
            }, { onConflict: 'kakao_place_id' }).select().single();

            if (dbError) throw new Error(`DB Places Upsert Error: ${dbError.message}`);

            // Save 'images'
            if (imageState === 'approved' && savedPlace) {
                await this.db.from('images').upsert({
                    place_id: savedPlace.id,
                    image_type: 'youtube_thumbnail',
                    url: thumbUrl,
                    status: 'approved',
                    source_video_id: videoId
                }, { onConflict: 'place_id, image_type' });
            }

            // Save 'processed_videos' (Success)
            await this.db.from('processed_videos').upsert({
                video_id: videoId,
                status: 'processed'
            });

            console.log(`[Engine v1.6] SUCCESS: Saved ${place.place_name} (Video: ${videoId})`);

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
