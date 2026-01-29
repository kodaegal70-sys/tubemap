
/**
 * Seed Keyword Strategy Test Script
 * Validates the expanded search logic without modifying the core engine.
 */

import { TubeMapEngine } from '../src/lib/v3/engine/TubeMapEngine';
import { CONFIG } from '../src/lib/v3/engine/config';
import { YouTubeCollector } from '../src/lib/v3/engine/YouTubeCollector';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// --- 1. Seed Keyword Definitions ---
const ACTION_KEYWORDS = [
    '다녀왔어요', '방문기', '직접 가본', '먹어봤습니다',
    '줄서서', '웨이팅', '리뷰', '사장님 인터뷰', '가게 방문'
];

const REGION_KEYWORDS = [
    '서울', '강남', '홍대', '성수', '종로', '잠실',
    '부산', '대구', '대전', '광주', '수원', '인천', '판교', '일산', '분당'
];

// --- 2. Filter Conditions ---
const FOOD_KEYWORDS = ['맛집', '식당', '가게', '음식', '메뉴', 'restaurant', 'food', 'eat'];
const VISIT_KEYWORDS = ['방문', '웨이팅', '줄서서', '사장님', '주문', '포장', '매장', '다녀왔습니다', '먹어봤습니다'];

// --- 3. Helper Functions ---
function getRandomItem(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateSeedKeyword() {
    const type = Math.random(); // 0.0 ~ 1.0

    let seed = "";
    let typeName = "";

    // A Type: Region + Action (33%)
    if (type < 0.33) {
        const region = getRandomItem(REGION_KEYWORDS);
        const action = getRandomItem(ACTION_KEYWORDS);
        seed = `${region} ${action}`;
        typeName = "A (Region)";
    }
    // B Type: Channel + Action (33%)
    else if (type < 0.66) {
        const channel = getRandomItem(CONFIG.YOUTUBE_CHANNELS);
        const action = getRandomItem(ACTION_KEYWORDS);
        seed = `${channel} ${action}`;
        typeName = "B (Channel)";
    }
    // C Type: Broadcast + Action (33%)
    else {
        const broadcast = getRandomItem(CONFIG.BROADCAST_PROGRAMS);
        const action = getRandomItem(ACTION_KEYWORDS);
        seed = `${broadcast} ${action}`;
        typeName = "C (Broadcast)";
    }

    return { seed, typeName };
}

// Custom Collector logic for Testing (overrides strict legacy filters just for this test)
// Function to check if video passes Step 1 filter
function validateVideo(video: any) {
    const textToCheck = `${video.title} ${video.description || ''}`.toLowerCase();

    // Condition 1: Food Keywords
    const hasFood = FOOD_KEYWORDS.some(k => textToCheck.includes(k.toLowerCase()));
    if (!hasFood) return { pass: false, reason: "No Food Keyword" };

    // Condition 2: Visit Keywords
    const hasVisit = VISIT_KEYWORDS.some(k => textToCheck.includes(k.toLowerCase()));
    if (!hasVisit) return { pass: false, reason: "No Visit Keyword" };

    // Validated
    return { pass: true, reason: "Passed" };
}


// --- 4. Main Test Runner ---
async function runTest() {
    console.log("🚀 [Seed Strategy Test] Starting...");

    // We reuse the engine primarily for Kakao matching, but we'll do search manually to control params
    const engine = new TubeMapEngine();
    const collector = new YouTubeCollector(); // To use its helper methods if needed

    // Try 5 random seeds
    for (let i = 1; i <= 5; i++) {
        const { seed, typeName } = generateSeedKeyword();
        console.log(`\n--------------------------------------------------`);
        console.log(`[Test #${i}] Type: ${typeName} | Query: "${seed}"`);
        console.log(`--------------------------------------------------`);

        try {
            // Manual Search to apply custom params
            // Note: YouTubeCollector.searchVideos() is simple, we might need to rely on it 
            // but it hardcodes some params. For this test, we assume the Collector's search is generic enough
            // or we might barely modify it. 
            // Ideally we'd call the API directly here but for simplicity let's use the collector
            // and see what raw results we get.

            // Wait, standard engine search adds specific filters. We want raw broad search.
            // Let's use the engine's search but we might need to accept we can't change param 'safeSearch' easily 
            // without modifying collector. 
            // Actually, let's just use the collector's public search method.

            const videoIds = await collector.searchVideos(seed, 5); // Get max 5 to test

            if (videoIds.length === 0) {
                console.log("⚠️ No videos found for this seed.");
                continue;
            }

            console.log(`🔍 Found ${videoIds.length} candidate videos. Validating...`);

            for (const videoId of videoIds) {
                // Get details
                const details = await collector.getVideoDetails(videoId);
                if (!details) {
                    console.log(`  - ${videoId}: Failed to fetch details`);
                    continue;
                }

                // Apply Test Filters
                const validation = validateVideo(details);

                if (validation.pass) {
                    console.log(`  ✅ [PASS] ${details.title.substring(0, 40)}...`);

                    // Try processing it with the REAL engine to see if it would extract a place
                    // This is the ultimate test: Does this new seed yield a valid place in Kakao?
                    console.log(`     -> Attempting Engine Pipeline (Extraction & Kakao Match)...`);
                    try {
                        // We hijack the processSingleVideo logic slightly by calling it directly
                        // But since we want to see logs, we just call it.
                        // Note: normal engine.processSingleVideo does DB checks. 
                        await engine.processSingleVideo(videoId, seed);
                    } catch (e: any) {
                        console.log(`     ❌ Engine Pipeline Error: ${e.message}`);
                    }

                } else {
                    console.log(`  ⛔ [SKIP] ${details.title.substring(0, 40)}... (${validation.reason})`);
                }
            }

        } catch (e) {
            console.error("Critical Error during test:", e);
        }

        // Pause
        await new Promise(r => setTimeout(r, 2000));
    }
}

runTest();
