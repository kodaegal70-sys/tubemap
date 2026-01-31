import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface KakaoDetailedInfo {
    id: string;
    name: string;
    category: string;
    address: string;
    road_address?: string;
    phone: string;
    lat: number;
    lng: number;
    menu_image_url: string;
    top_menus: string;
}

export class KakaoScraper {
    /**
     * 카카오맵 상세 데이터 추출 (캐시 우선 -> 웹 스크래핑 -> API 백업)
     */
    async getPlaceDetails(placeId: string, hint?: { name?: string; address?: string }): Promise<KakaoDetailedInfo | null> {
        // 1. 캐시 확인
        try {
            const cachePath = path.join(process.cwd(), 'src', 'data', 'kakao_cache', `${placeId}.json`);
            if (fs.existsSync(cachePath)) {
                console.log(`[KakaoScraper] Hit Cache: ${placeId}`);
                const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
                if (data.basicInfo) {
                    const parsed = this.parseKakaoData(placeId, data);
                    // 좌표가 유효한 경우에만 반환
                    if (parsed.lat !== 0 && parsed.lng !== 0) return parsed;
                    console.log(`[KakaoScraper] Cache exists but coordinates are 0,0. Proceeding to fetch...`);
                }
            }
        } catch (e) {
            console.warn(`[KakaoScraper] Cache read failed: ${placeId}`);
        }

        // 2. 웹 스크래핑 시도
        try {
            const url = `https://place.map.kakao.com/main/v/${placeId}`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': `https://place.map.kakao.com/${placeId}`
                },
                timeout: 5000,
                validateStatus: (status) => status < 500 // 4xx 에러도 catch로 가지 않고 잡음
            });

            if (response.status === 200 && response.data && response.data.basicInfo) {
                const parsed = this.parseKakaoData(placeId, response.data);
                if (parsed.lat !== 0 && parsed.lng !== 0) return parsed;
                console.warn(`[KakaoScraper] Web Scrape success but coordinates missing for ${placeId}.`);
            } else {
                console.warn(`[KakaoScraper] Web Scrape failed (Status: ${response.status}) for ${placeId}. Forcing REST Fallback.`);
            }
        } catch (error: any) {
            console.error(`[KakaoScraper] Web Scrape Error for ${placeId}: ${error.message}. Forcing REST Fallback.`);
        }

        // 3. 마지막 수단: 카카오 로컬 REST API (Search)
        // 힌트가 없어도 placeId 기반으로 최소한의 시도를 하기 위해 빈 객체라도 전달
        try {
            return await this.fetchFromREST(placeId, hint || {});
        } catch (apiError) {
            console.error(`[KakaoScraper] API Fallback failed for ${placeId}`);
        }

        return null;
    }

    /**
     * 주소 문자열을 기반으로 좌표(위경도)를 추출 (카카오 로컬 API 사용)
     */
    public async getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
        const apiKey = process.env.KAKAO_LOCAL_API_KEY;
        if (!apiKey || !address) return null;

        try {
            console.log(`[KakaoScraper] GEOCODING ADDRESS: "${address}"`);
            const res = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
                params: { query: address },
                headers: { 'Authorization': `KakaoAK ${apiKey}` }
            });

            const doc = res.data?.documents?.[0];
            if (doc) {
                console.log(`[KakaoScraper] GEOCODE SUCCESS: ${address} -> LAT: ${doc.y}, LNG: ${doc.x}`);
                return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
            }

            // 주소 검색 실패 시 키워드 검색으로 한 번 더 시도
            const keywordRes = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
                params: { query: address, size: 1 },
                headers: { 'Authorization': `KakaoAK ${apiKey}` }
            });
            const kwDoc = keywordRes.data?.documents?.[0];
            if (kwDoc) {
                console.log(`[KakaoScraper] KEYWORD GEOCODE SUCCESS: ${address} -> LAT: ${kwDoc.y}, LNG: ${kwDoc.x}`);
                return { lat: parseFloat(kwDoc.y), lng: parseFloat(kwDoc.x) };
            }

        } catch (e: any) {
            console.error("[KakaoScraper] Geocoding Error", e.message);
        }
        return null;
    }

    /**
     * 카카오 로컬 REST API를 사용하여 좌표 및 정보 강제 검색 (REST 전용 정책)
     */
    public async fetchFromREST(placeId: string, hint: { name?: string; address?: string }): Promise<KakaoDetailedInfo | null> {
        const apiKey = process.env.KAKAO_LOCAL_API_KEY;
        if (!apiKey) return null;

        // 이름이나 주소 둘 중 하나는 있어야 검색 가능
        const query = hint.name || hint.address;
        if (!query) return null;

        try {
            console.log(`[KakaoScraper] 🔍 Falling back to REST Keywork Search: "${query}"`);
            const res = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
                params: { query, size: 5 },
                headers: { 'Authorization': `KakaoAK ${apiKey}` }
            });

            const docs = res.data?.documents || [];
            if (docs.length === 0) return null;

            // 1순위: ID가 일치하는 항목 찾기
            let selected = docs.find((d: any) => d.id === placeId);

            // 2순위: ID 일치가 없으면 가장 첫 번째 항목 (가장 유사함)
            if (!selected) selected = docs[0];

            console.log(`[KakaoScraper] ✅ REST Search Found: ${selected.place_name} (${selected.y}, ${selected.x})`);

            return {
                id: placeId,
                name: selected.place_name,
                category: selected.category_name,
                address: selected.address_name,
                road_address: selected.road_address_name,
                phone: selected.phone || "",
                lat: parseFloat(selected.y),
                lng: parseFloat(selected.x),
                menu_image_url: "",
                top_menus: ""
            };

        } catch (e: any) {
            console.error(`[KakaoScraper] REST Fallback Error: ${e.message}`);
        }
        return null;
    }

    /**
     * 카카오 상세 JSON 데이터를 공통 포맷으로 파싱 (외부에서도 사용 가능)
     */
    public parseKakaoData(placeId: string, data: any): KakaoDetailedInfo {
        const basic = data.basicInfo;
        const menuInfo = data.menuInfo;
        const photo = data.photo;

        let menuImageUrl = '';
        if (photo && photo.photoList && photo.photoList.length > 0) {
            const menuPhoto = photo.photoList.find((p: any) => p.category === 'MENU' || p.category === '메뉴') || photo.photoList[0];
            menuImageUrl = menuPhoto.orgurl || '';
        }

        let topMenus = '';
        if (basic.menu_items && basic.menu_items.length > 0) {
            topMenus = basic.menu_items.join(', ');
        } else if (menuInfo && menuInfo.menuList && menuInfo.menuList.length > 0) {
            topMenus = menuInfo.menuList.slice(0, 3).map((m: any) => m.menu).join(', ');
        }

        const rawAddress = basic.address?.region?.newaddr?.name
            ? `${basic.address.region.newaddr.fullAddress} ${basic.address.newaddr?.buildingname || ''}`.trim()
            : basic.address?.addressname?.fullAddress || '';

        const rawRoadAddress = basic.address?.newaddr?.fullAddress
            ? `${basic.address.newaddr.fullAddress} ${basic.address.newaddr.buildingname || ''}`.trim()
            : undefined;

        return {
            id: placeId,
            name: basic.placenamefull || '',
            category: basic.category?.fullname || '',
            address: this.normalizeAddress(rawAddress),
            road_address: rawRoadAddress ? this.normalizeAddress(rawRoadAddress) : undefined,
            phone: basic.phonenum || '',
            lat: basic.wgs84?.lat ? Number(basic.wgs84.lat) : 0,
            lng: basic.wgs84?.lon ? Number(basic.wgs84.lon) : 0,
            menu_image_url: menuImageUrl,
            top_menus: topMenus
        };
    }

    private normalizeAddress(addr: string): string {
        if (!addr) return "";
        let clean = addr
            .replace(/\(\우\)\d{5}/g, '') // (우)05548 제거
            .replace(/복사/g, '')         // '복사' 텍스트 제거
            .replace(/지번|우편번호/g, '') // '지번', '우편번호' 키워드 제거
            .replace(/\s+/g, ' ')       // 중복 공백 제거
            .trim();

        // [NEW] 층수(1층, 지하 1층, B1층 등) 이후 텍스트 제거 로직
        const floorMatch = clean.match(/(지하\s*\d+층|\d+층|B\d+층)/);
        if (floorMatch && floorMatch.index !== undefined) {
            clean = clean.substring(0, floorMatch.index + floorMatch[0].length);
        }
        return clean;
    }

    extractPlaceId(url: string): string | null {
        const match = url.match(/kakao\.com\/(\d+)/);
        return match ? match[1] : null;
    }
}
