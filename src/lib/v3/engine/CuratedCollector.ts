import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { YouTubeCollector } from './YouTubeCollector';
import { KakaoScraper } from '../extractor/KakaoScraper';

export class CuratedCollector {
    private db: any;
    private youtube: YouTubeCollector;
    private kakao: KakaoScraper;
    private dbEnabled: boolean = true;
    private targetChannelIds = [
        "UCl23-Cci_SMqyGXE1T_LYUg", // 성시경 SUNG SI KYUNG
        "UC4ZA57iJrf73bJlApKFeLRw", // 스튜디오 수제 (또간집)
        "UCmJEpV4hLzGWLU5rrdOHMhQ", // 더들리
        "UC1oXmhvYHVI2bApphh3IzuQ", // 정육왕 MeatCreator
        "UCAoyR-sL6B0S93AMR-HVTvg", // 떡볶퀸 Tteokbokqueen
        "UCkBoDzncl64EZ-Ggh4g5pCw", // 섬마을훈태TV
        "UCHbKKd7fH0bVz_F_rJ4jCgA", // 비밀이야 (Classic)
        "UCaKQ7_GT0k8u_sL0nE2tgkA", // 비밀이야 bimirya (New)
        "UCQA89gPDjJ-1M1o9bwdGF-g", // 맛있겠다 Yummy
        "UC8HsdoAxev3Lmmx2RGZH-2w", // 김사원세끼
        "UCoLPofyAZuuq6v4EWrWRguw", // 회사랑
        "UCqVjsRNWQM-ZBl27Pp8qI5g"  // 츄릅켠 Chulupkyeon
    ];

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        this.db = createClient(supabaseUrl!, supabaseKey!);
        this.youtube = new YouTubeCollector();
        this.kakao = new KakaoScraper();
    }

    /**
     * 상세 정보를 1회에 수집한 데이터를 바탕으로 처리 (효율화 버전)
     */
    async processLinkPair(youtubeUrl: string, kakaoUrl: string, siteDetail?: any): Promise<{ status: string, name: string, reason?: string }> {
        try {
            const videoId = this.extractVideoId(youtubeUrl);
            let kakaoId = siteDetail?.kakaoId || this.kakao.extractPlaceId(kakaoUrl);

            if (!videoId) throw new Error(`Invalid YouTube URL: ${youtubeUrl}`);

            // 1. 유튜브 정보 우선 획득
            const videoInfo = await this.youtube.getVideoDetails(videoId);
            if (!videoInfo) throw new Error("Failed to fetch Video Info");

            // [Whitelist Check]
            if (!this.targetChannelIds.includes(videoInfo.channelId)) {
                return { status: 'skipped', name: videoInfo.channelTitle, reason: `Not in Whitelist` };
            }

            // 2. 기본 정보 구성 (사이트 데이터 우선)
            let info: any = null;

            if (siteDetail && siteDetail.lat && (siteDetail.kakaoId || siteDetail.id)) {
                console.log(`[CuratedCollector] 📋 Using Site Data: ${siteDetail.name}`);
                info = {
                    id: siteDetail.kakaoId || `S${siteDetail.id}`, // kakaoId 우선, 없으면 siteDetail.id
                    name: siteDetail.name,
                    category: "식당", // SiteScraper는 카테고리 정보를 제공하지 않으므로 기본값
                    address: siteDetail.address,
                    road_address: siteDetail.address, // SiteScraper는 도로명 주소와 지번 주소를 구분하지 않으므로 동일하게 설정
                    lat: siteDetail.lat,
                    lng: siteDetail.lng,
                    menu_primary: siteDetail.menu_primary, // 필드명 통일
                    phone: "" // SiteScraper는 전화번호 정보를 제공하지 않음
                };
            } else if (kakaoId) {
                info = await this.kakao.getPlaceDetails(kakaoId);
            }

            if (!info) throw new Error(`Missing Info for: ${siteDetail?.name || videoId}`);

            const bestComment = await this.youtube.getBestComment(videoId);
            const finalImageUrl = videoInfo.thumbnailUrl || "";

            const placeData = {
                kakao_place_id: info.id,
                name: info.name,
                name_official: info.name,
                category: info.category || "식당",
                address: info.address || "",
                road_address: info.road_address || "",
                lat: info.lat || 0,
                lng: info.lng || 0,
                phone: info.phone || "",
                channel_title: videoInfo.channelTitle,
                media_label: `${videoInfo.channelTitle}`,
                video_url: `https://www.youtube.com/watch?v=${videoId}`,
                video_id: videoId,
                video_thumbnail_url: videoInfo.thumbnailUrl,
                best_comment: bestComment ? bestComment.text : '',
                best_comment_like_count: bestComment ? bestComment.likes : 0,
                menu_primary: info.menu_primary || info.top_menus || "", // 두 경로 모두 대응
                image_url: finalImageUrl,
                image_state: 'approved',
                image_type: 'owner_upload',
                updated_at: new Date().toISOString()
            };

            // 5. 기존 데이터 로드 및 병합
            const existingPlace = this.getExistingPlaceFromOffline(info.id);
            if (existingPlace) {
                const existingChannels = (existingPlace.channel_title || "").split(',').map((s: string) => s.trim()).filter(Boolean);
                const newChannels = (videoInfo.channelTitle || "").split(',').map((s: string) => s.trim()).filter(Boolean);
                const mergedChannels = Array.from(new Set([...existingChannels, ...newChannels]));
                placeData.channel_title = mergedChannels.join(', ');
                placeData.media_label = mergedChannels.join(', ');
            }

            // 6. DB 저장
            if (this.dbEnabled) {
                try {
                    const { error } = await this.db.from('places').upsert(placeData, { onConflict: 'kakao_place_id' });
                    if (error) this.dbEnabled = false;
                    else console.log(`[CuratedCollector] ✅ DB 저장 성공: ${placeData.name}`);
                } catch (dbErr) {
                    this.dbEnabled = false;
                }
            }

            this.saveToOfflineFile(placeData);
            return { status: 'success', name: placeData.name };

        } catch (error: any) {
            console.error(`[CuratedCollector] 🚨 오류:`, error.message);
            return { status: 'error', name: '수집 실패', reason: error.message };
        }
    }

    private saveToOfflineFile(newPlace: any) {
        if (!newPlace) return;
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
            let currentData = [];
            if (fs.existsSync(filePath)) {
                currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
            const index = currentData.findIndex((p: any) => p.kakao_place_id === newPlace.kakao_place_id);
            if (index >= 0) currentData[index] = newPlace;
            else currentData.push(newPlace);
            fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
        } catch (e) {
            console.error("[CuratedCollector] Offline save failed", e);
        }
    }

    private getExistingPlaceFromOffline(kakaoId: string): any | null {
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
            if (!fs.existsSync(filePath)) return null;
            const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return currentData.find((p: any) => p.kakao_place_id === kakaoId) || null;
        } catch (e) { return null; }
    }

    private extractVideoId(url: string | null): string | null {
        if (!url) return null;
        const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }
}
