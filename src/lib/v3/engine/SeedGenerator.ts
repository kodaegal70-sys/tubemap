/**
 * SeedGenerator.ts
 * Implements the "TubeMap Seed Search Expansion" logic.
 * Generates search keywords by combining Visit Actions with Regions, Channels, or Broadcasts.
 */
import { CONFIG } from './config';

// 1) Suffix Keywords (Simplification v2.0)
const SUFFIX_KEYWORDS = [
    "맛집",
    "식당",
    "가게"
];

// 2) Region Keywords (Automatic Combination)
const REGION_KEYWORDS = [
    "서울", "강남", "홍대", "성수", "종로",
    "잠실", "부산", "대구", "대전", "광주",
    "수원", "인천", "판교", "일산", "분당"
];

export type SeedType = 'REGION_SEARCH' | 'CHANNEL_SEARCH' | 'BROADCAST_SEARCH';

export class SeedGenerator {

    /**
     * Generates a random seed query based on Type A or B (v2.0: Simplified).
     */
    static generateSeed(): { query: string, type: SeedType, source: string } {
        const rand = Math.random();

        // 50% Region, 50% Channel
        if (rand < 0.5) {
            return this.generateTypeA();
        } else {
            return this.generateTypeB();
        }
    }

    // Type A: Region + Suffix
    private static generateTypeA() {
        const region = this.getRandom(REGION_KEYWORDS);
        const suffix = this.getRandom(SUFFIX_KEYWORDS);
        return {
            query: `${region} ${suffix}`,
            type: 'REGION_SEARCH' as SeedType,
            source: region
        };
    }

    // Type B: Channel + Suffix (or just Channel sometimes?)
    // User Request: "Channel Name + Mutjib/Restaurant/Store"
    private static generateTypeB() {
        const channel = this.getRandom(CONFIG.YOUTUBE_CHANNELS);
        // Occasionally just search channel name? No, user said combination.
        const suffix = this.getRandom(SUFFIX_KEYWORDS);
        return {
            query: `${channel} ${suffix}`,
            type: 'CHANNEL_SEARCH' as SeedType,
            source: channel
        };
    }

    private static getRandom<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
}
