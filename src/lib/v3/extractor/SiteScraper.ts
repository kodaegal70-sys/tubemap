import axios from 'axios';
import { KakaoScraper } from './KakaoScraper';

export interface SiteRestaurantDetail {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    youtubeUrl: string;
    kakaoId: string | null;
    menu_primary: string;
}

export class SiteScraper {
    private static readonly API_URL = 'https://api.youtubeplace.co.kr/main/initialData';
    private static readonly BASE_URL = 'https://youtubeplace.co.kr';
    private kakao: KakaoScraper;

    // API 채널 ID 매핑
    private static readonly CHANNEL_ID_MAP: Record<string, string> = {
        '성시경 SUNG SI KYUNG': '1',
        '스튜디오 수제 (또간집)': '2',
        '비밀이야': '3',
        '더들리': '4',
        '김사원세끼': '5',
        '섬마을훈태TV': '6',
        '맛있겠다 Yummy': '7',
        '떡볶퀸 Tteokbokqueen': '8',
        '정육왕 MeatCreator': '9',
        '츄릅켠 Chulupkyeon': '10',
        '회사랑': '11'
    };

    constructor() {
        this.kakao = new KakaoScraper();
    }

    async init() { }
    async close() { }

    async getRestaurantsFromChannel(channelName: string, limit: number = 100): Promise<Array<any>> {
        const targetId = SiteScraper.CHANNEL_ID_MAP[channelName];
        if (!targetId) return [];

        console.log(`[SiteScraper] 🌐 Fetching List for ${channelName}...`);
        try {
            const response = await axios.get(SiteScraper.API_URL);
            const allRestaurants = response.data.restaurantResult || [];

            return allRestaurants.filter((item: any) => {
                if (!item.ytbList) return false;
                const ids = item.ytbList.split('|').map((s: string) => s.split(',')[0]);
                return item.ytbList.includes(`,${targetId}`) ||
                    item.ytbList.includes(`${targetId},`) ||
                    item.ytbList.split('|').some((s: string) => s.endsWith(`,${targetId}`)) ||
                    item.ytbList === targetId;
            }).map((item: any) => ({
                id: item.id,
                name: item.name,
                address: item.address,
                sourceVideoId: item.ytbList.split(',')[0]
            })).slice(0, limit);

        } catch (e: any) {
            console.error(`[SiteScraper] ❌ API Fetch Error: ${e.message}`);
            return [];
        }
    }

    /**
     * 상세 정보를 수집하고 유효하지 않을 경우 목록 데이터로 복구 (정석 회복 로직)
     */
    async getRestaurantDetail(itemId: string, hint: { videoId?: string, name?: string, address?: string }): Promise<SiteRestaurantDetail | null> {
        const detailUrl = `${SiteScraper.BASE_URL}/restaurant/${itemId}`;
        console.log(`[SiteScraper] 🔍 Fetching Detail: ${detailUrl}`);

        try {
            const response = await axios.get(detailUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                timeout: 5000
            });

            // __NEXT_DATA__ 추출 (가장 확실한 JSON 덩어리 추출)
            const match = response.data.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
            let r: any = null;

            if (match) {
                try {
                    const content = match[1].trim();
                    const startIdx = content.indexOf('{');
                    const endIdx = content.lastIndexOf('}') + 1;
                    const data = JSON.parse(content.substring(startIdx, endIdx));
                    const p = data.props?.pageProps;
                    r = p?.data || p?.restaurant || p?.item || {};
                } catch (e) {
                    console.warn(`[SiteScraper] JSON Parse failed for ${itemId}`);
                }
            }

            const name = r?.name || hint.name || "";
            const address = r?.address || hint.address || "";

            // 1. 유튜브 링크 (힌트 데이터가 1순위)
            let youtubeUrl = "";
            const vId = hint.videoId || r?.ytbList?.split(',')[0] || r?.youtubeUrl?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
            if (vId) youtubeUrl = `https://www.youtube.com/watch?v=${vId}`;

            // 2. 카카오 ID 복구 (페이지 소스 우선 -> 검색 차선)
            let kakaoId = r?.kakaoId || null;
            const kakaoMatch = response.data.match(/place\.map\.kakao\.com\/(\d+)/);
            if (kakaoMatch) kakaoId = kakaoMatch[1];

            // 3. 좌표 복구 (JSON 우선 -> 카카오 API 차선)
            let lng = parseFloat(r?.x || "0");
            let lat = parseFloat(r?.y || "0");

            // [핵심 보정 로직] ID나 좌표가 없으면 카카오 REST API로 강제 검색
            if (!kakaoId || lat === 0 || lng === 0) {
                if (name && address) {
                    const searchRes = await this.kakao.fetchFromREST("", { name, address });
                    if (searchRes) {
                        kakaoId = kakaoId || searchRes.id;
                        lat = lat || searchRes.lat;
                        lng = lng || searchRes.lng;
                    }
                }
            }

            // 4. 메뉴 / 해시태그 / 설명 (menu_primary) - 승인된 우선순위
            let menu_primary = "";

            if (r?.menus && Array.isArray(r.menus) && r.menus.length > 0) {
                menu_primary = r.menus.slice(0, 3).map((m: any) => m.name).join(', ');
            }
            if (!menu_primary && r?.tags && Array.isArray(r.tags) && r.tags.length > 0) {
                menu_primary = r.tags.slice(0, 3).map((t: string) => t.replace('#', '').trim()).join(', ');
            }
            if (!menu_primary && r?.microReviews) {
                menu_primary = r.microReviews.substring(0, 100).trim();
            }

            if (!menu_primary) menu_primary = `${name} 메뉴 준비 중`;

            return { id: itemId, name, address, lat, lng, youtubeUrl, kakaoId, menu_primary };

        } catch (e: any) {
            console.error(`[SiteScraper] ❌ Detail fetch failed: ${e.message}`);
            return null;
        }
    }

    // 하위 호환성을 위해 유지 (사용 안함)
    async getYoutubeLinkFromDetail(detailUrl: string): Promise<string | null> { return null; }
}
