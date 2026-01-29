/**
 * TubeMap Engine v1.6: Kakao Matcher
 * Handles location search and strict validation/scoring.
 */
import axios from 'axios';
import { CONFIG } from './config';

export interface KakaoPlace {
    id: string;
    place_name: string;
    category_name: string;
    phone: string;
    address_name: string;
    road_address_name: string;
    x: string; // lng
    y: string; // lat
    category_group_code: string;
    place_url: string;
}

export interface MatchResult {
    place: KakaoPlace;
    score: number;
    status: 'approved' | 'review' | 'rejected';
    reason?: string;
    menu_hint?: string;
}

export class KakaoMatcher {
    private apiKey: string;

    constructor() {
        this.apiKey = CONFIG.API_KEYS.KAKAO;
        if (!this.apiKey) throw new Error("KAKAO_LOCAL_API_KEY is missing");
    }

    /**
     * STEP 3: Search Place
     */
    async searchPlace(name: string, area?: string, menu?: string): Promise<MatchResult | null> {
        try {
            // Query Construction: Area + Name + Menu
            const query = [area, name, menu].filter(s => !!s).join(" ");

            const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
                headers: {
                    Authorization: `KakaoAK ${this.apiKey}`,
                    "KA": "sdk/1.0.0 os/javascript lang/en-US device/Win32 origin/http://localhost:3000",
                    "Origin": "http://localhost:3000" // Mock origin for JS key
                },
                params: { query: query, size: 5 }
            });

            const items = response.data.documents as KakaoPlace[];
            if (!items || items.length === 0) return null;

            // Strict Scoring (Step 3)
            let bestResult: MatchResult | null = null;
            let highestScore = 0;

            for (const item of items) {
                const score = this.calculateScore(name, area, item);
                if (score > highestScore) {
                    highestScore = score;

                    let status: MatchResult['status'] = 'rejected';
                    if (score >= 80) status = 'approved';
                    else if (score >= 60) status = 'review';

                    bestResult = { place: item, score, status, menu_hint: menu };
                }
            }

            return bestResult;

        } catch (error) {
            console.error("[KakaoMatcher] Search Error:", error);
            return null;
        }
    }

    /**
     * STEP 3 & 4: Calculate Match Score
     */
    private calculateScore(queryName: string, queryArea: string | undefined, item: KakaoPlace): number {
        let score = 0;

        // 1. Name Similarity (Max 50)
        const cleanQuery = queryName.replace(/ /g, "");
        const cleanItem = item.place_name.replace(/ /g, "");
        if (cleanItem === cleanQuery) score += 50;
        else if (cleanItem.includes(cleanQuery) || cleanQuery.includes(cleanItem)) score += 40;

        // 2. Area Match (Max 30)
        if (queryArea) {
            if (item.address_name.includes(queryArea) || item.road_address_name.includes(queryArea)) {
                score += 30;
            }
        } else {
            // No area hint provided? Neutral.
            score += 10;
        }

        // 3. Category Check (Max 20)
        // Check if item.category_name includes '음식점' or keywords
        if (item.category_group_code === 'FD6' || item.category_name.includes('음식점')) {
            score += 20;
        } else if (item.category_group_code === 'CE7') { // Cafe
            score += 15;
        }

        return score;
    }

    /**
     * STEP 4: Address Cross-Verification
     * Check if place address components exist in video text (desc/comments)
     */
    verifyAddressInText(place: KakaoPlace, videoText: string): boolean {
        // Extract distinct parts of address (e.g. "Seoul", "Gangnam-gu", "Yeoksam-dong")
        const parts = place.address_name.split(" ");
        let matchCount = 0;

        // Skip first part (Province) as it's too broad usually, check City/District
        for (const part of parts) {
            if (part.length < 2) continue;
            if (videoText.includes(part)) matchCount++;
        }

        return matchCount > 0;
    }
}
