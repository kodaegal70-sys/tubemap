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
    private dbEnabled: boolean = true; // DB 시도 여부 플래그

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        this.db = createClient(supabaseUrl!, supabaseKey!);
        this.youtube = new YouTubeCollector();
        this.kakao = new KakaoScraper();
    }

    /**
     * 링크 쌍(유튜브, 카카오)을 처리하여 정보를 추출하고 DB 또는 로컬 파일에 저장
     */
    async processLinkPair(youtubeUrl: string, kakaoUrl: string, preFetchedKakao?: any): Promise<{ status: string, name: string, reason?: string }> {
        try {
            const videoId = this.extractVideoId(youtubeUrl);
            const kakaoId = this.kakao.extractPlaceId(kakaoUrl);

            if (!videoId || !kakaoId) throw new Error(`Invalid URLs: YT=${videoId}, Kakao=${kakaoId}`);

            // 1. 유튜브 정보 우선 획득
            const videoInfo = await this.youtube.getVideoDetails(videoId);
            if (!videoInfo) throw new Error("Failed to fetch Video Info");

            // 2. 카카오 정보 획득 (주입된 데이터 우선 -> 캐시 -> API)
            let info: any = preFetchedKakao ? this.kakao.parseKakaoData(kakaoId, preFetchedKakao) : null;

            // [중요] 브라우저에서 선택한 이미지가 있다면 파싱된 결과에 다시 붙여줌
            if (preFetchedKakao && preFetchedKakao.photo?.selectedPhoto) {
                info.photo = { selectedPhoto: preFetchedKakao.photo.selectedPhoto };
            }

            if (!info) {
                const [fetchedKakao, bestCommentResult] = await Promise.all([
                    this.kakao.getPlaceDetails(kakaoId, { name: videoInfo.title }),
                    this.youtube.getBestComment(videoId)
                ]);
                info = fetchedKakao;
                // bestComment 처리는 아래에서
            }

            const bestComment = await this.youtube.getBestComment(videoId);
            if (!info) {
                console.warn(`[CuratedCollector] Kakao Data missing for ${kakaoId}. Using skeleton fallback.`);
                info = {
                    id: kakaoId,
                    name: null,
                    category: null,
                    address: null,
                    phone: null,
                    lat: 0,
                    lng: 0,
                    top_menus: null,
                    image_url: null
                };
            }

            // 4. 이미지 결정 (카카오 전용 이미지 확보)
            const selectedPhoto = (info as any).photo?.selectedPhoto;
            let finalImageUrl = (info as any).image_url || "";
            let isKakaoImageValid = !!finalImageUrl;

            if (selectedPhoto && selectedPhoto.orgurl) {
                console.log(`[CuratedCollector] ✨ 브라우저에서 선택된 최적 이미지 사용: ${selectedPhoto.orgurl.substring(0, 50)}...`);
                finalImageUrl = selectedPhoto.orgurl;
                isKakaoImageValid = true;
            } else {
                console.log(`[CuratedCollector] 📸 카카오(Vantage) 이미지 없음 -> 유튜브 썸네일로 대체합니다.`);
                finalImageUrl = videoInfo.thumbnailUrl || ""; // Vantage 없을 시 유튜브 썸네일 사용
                isKakaoImageValid = !!finalImageUrl;
            }

            // 5. 데이터 구성 (둘 다 저장)
            const placeData: any = {
                kakao_place_id: info.id,
                name: info.name,
                name_official: info.name,
                category: info.category,
                address: info.address,
                road_address: info.road_address || "",
                lat: info.lat || 0,
                lng: info.lng || 0,
                phone: info.phone || "",

                channel_title: videoInfo.channelTitle,
                media_label: `${videoInfo.channelTitle}`,

                video_url: `https://www.youtube.com/watch?v=${videoId}`,
                video_id: videoId,
                video_thumbnail_url: videoInfo.thumbnailUrl, // 상세카드용 유튜브 썸네일 (필수)

                best_comment: bestComment ? bestComment.text : '',
                best_comment_like_count: bestComment ? bestComment.likes : 0,

                menu_primary: (info as any).top_menus || "",
                image_url: finalImageUrl, // 일반카드용 카카오 이미지

                image_state: isKakaoImageValid ? 'approved' : 'pending',
                image_type: isKakaoImageValid ? 'owner_upload' : 'none',

                updated_at: new Date().toISOString()
            };

            // 6. DB 저장 (Supabase Upsert) - 점검 중이거나 실패 경험이 있으면 건너뜀
            if (this.dbEnabled) {
                try {
                    const { error } = await this.db.from('places').upsert(placeData, { onConflict: 'kakao_place_id' });
                    if (error) {
                        console.warn(`[CuratedCollector] ⚠️ DB 연결 불가 (서버 점검 중). 오프라인 모드로 즉시 전환.`);
                        this.dbEnabled = false;
                    } else {
                        console.log(`[CuratedCollector] ✅ DB 저장 성공: ${placeData.name}`);
                    }
                } catch (dbErr: any) {
                    this.dbEnabled = false;
                }
            }

            // [핵심] 모든 데이터는 무조건 오프라인 파일에 보존 (성공 시든 실패 시든 파일에도 기록)
            this.saveToOfflineFile(placeData);
            return { status: 'success', name: placeData.name };

        } catch (error: any) {
            console.error(`[CuratedCollector] 🚨 수집 처리 중 오류:`, error.message);
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
            if (index >= 0) {
                currentData[index] = newPlace;
            } else {
                currentData.push(newPlace);
            }

            fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
        } catch (e) {
            console.error("[CuratedCollector] Offline save failed", e);
        }
    }

    private extractVideoId(url: string): string | null {
        const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    private async validateImage(url: string): Promise<boolean> {
        if (!url) return false;
        try {
            const res = await axios.head(url, { timeout: 3000 });
            return res.status === 200;
        } catch {
            return false;
        }
    }
}
