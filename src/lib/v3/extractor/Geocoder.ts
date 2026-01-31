import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface GeocodeResult {
    lat: number;
    lng: number;
    provider: string;
    confidence?: number;
}

export class Geocoder {
    private cachePath: string;
    private cache: Record<string, GeocodeResult> = {};
    private openCageApiKey: string | undefined;

    constructor() {
        this.cachePath = path.join(process.cwd(), 'src', 'data', 'geocode_cache.json');
        this.openCageApiKey = process.env.OPENCAGE_API_KEY;
        this.loadCache();
    }

    private loadCache() {
        if (fs.existsSync(this.cachePath)) {
            try {
                this.cache = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
            } catch (e) {
                console.error("[Geocoder] Cache Load Error", e);
                this.cache = {};
            }
        }
    }

    private saveCache() {
        const dir = path.dirname(this.cachePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2));
    }

    /**
     * 주소 정규화: (우)00000, 괄호 안의 우편번호 등을 제거
     */
    public normalizeAddress(address: string): string {
        return address
            .replace(/\(우\)\d+/g, '') // (우)12345 제거
            .replace(/\(\d{5}\)/g, '') // (12345) 제거
            .replace(/\[\d{5}\]/g, '') // [12345] 제거
            .replace(/\s+/g, ' ')      // 다중 공백 단일화
            .trim();
    }

    /**
     * 안전한 지연: 0.7초 ~ 1.2초 사이의 랜덤 딜레이
     */
    private async randomDelay() {
        const ms = Math.floor(Math.random() * (1200 - 700 + 1) + 700);
        await new Promise(r => setTimeout(r, ms));
    }

    /**
     * 재시도를 포함한 API 호출 래퍼
     */
    private async fetchWithRetry(url: string, params: any, headers?: any): Promise<any> {
        const backoff = [2000, 5000, 10000, 20000];

        for (let attempt = 0; attempt <= backoff.length; attempt++) {
            try {
                // 호출 전 랜덤 딜레이 (Rate Limit 준수)
                await this.randomDelay();

                const res = await axios.get(url, {
                    params,
                    headers,
                    timeout: 5000
                });
                return res.data;
            } catch (e: any) {
                const status = e.response?.status;
                const isRetryable = status === 429 || status === 503;

                if (isRetryable && attempt < backoff.length) {
                    const delay = backoff[attempt];
                    console.warn(`[Geocoder] ⚠️ ${status} 에러 발생. ${delay}ms 후 재시도... (${attempt + 1}/${backoff.length})`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    if (status) console.error(`[Geocoder] API Error: ${status} - ${url}`);
                    else console.error(`[Geocoder] API Error: ${e.message}`);
                    break;
                }
            }
        }
        return null;
    }

    public async geocode(address: string): Promise<GeocodeResult | null> {
        const normalized = this.normalizeAddress(address);
        if (!normalized) return null;

        if (this.cache[normalized]) {
            console.log(`[Geocoder] 📦 Cache Hit: ${normalized}`);
            return this.cache[normalized];
        }

        console.log(`[Geocoder] 🌐 Geocoding: "${normalized}"...`);

        // 1순위: OpenCage
        let result = await this.fetchOpenCage(normalized);

        // 2순위: Nominatim
        if (!result) {
            console.log(`[Geocoder] 🔄 OpenCage failed. Trying Nominatim...`);
            result = await this.fetchNominatim(normalized);
        }

        if (result) {
            this.cache[normalized] = result;
            this.saveCache();
            return result;
        }

        return null;
    }

    private async fetchOpenCage(address: string): Promise<GeocodeResult | null> {
        if (!this.openCageApiKey) return null;

        const data = await this.fetchWithRetry(
            `https://api.opencagedata.com/geocode/v1/json`,
            {
                q: address,
                key: this.openCageApiKey,
                language: 'ko',
                limit: 1
            }
        );

        const result = data?.results?.[0];
        if (result && result.geometry) {
            return {
                lat: result.geometry.lat,
                lng: result.geometry.lng,
                provider: 'opencage',
                confidence: result.confidence
            };
        }
        return null;
    }

    private async fetchNominatim(address: string): Promise<GeocodeResult | null> {
        const data = await this.fetchWithRetry(
            `https://nominatim.openstreetmap.org/search`,
            {
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 1
            },
            { 'User-Agent': 'MediastoreMapCollector/1.0 (contact@example.com)' }
        );

        const result = data?.[0];
        if (result) {
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                provider: 'nominatim'
            };
        }
        return null;
    }
}
