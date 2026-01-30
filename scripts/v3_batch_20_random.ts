
/**
 * TubeMap Engine v1.8 Random Batch Runner
 * Collects 20 new places using A/B/C Type Seed Strategy.
 */
import { TubeMapEngine } from '../src/lib/v3/engine/TubeMapEngine';
import { getSupabaseClient } from '../src/lib/supabaseClient';
import { CONFIG } from '../src/lib/v3/engine/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// --- STRATEGY DEFINITIONS ---
const ACTION_KEYWORDS = [
    '다녀왔어요', '방문기', '직접 가본', '먹어봤습니다',
    '줄서서', '웨이팅', '리뷰', '사장님 인터뷰', '가게 방문'
];

const REGION_KEYWORDS = [
    '서울', '강남', '홍대', '성수', '종로', '잠실',
    '부산', '대구', '대전', '광주', '수원', '인천', '판교', '일산', '분당'
];

function getRandomItem(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateSeedKeyword() {
    // [Modified Probabilities]
    // Region seeds are too broad and noisy for now. 
    // Focus on Channel (B) and Broadcast (C) for high quality first.
    // A(10%), B(45%), C(45%)
    const type = Math.random();

    let seed = "";
    let typeName = "";
    let sourceLabel = "";

    // A Type: Region + Action (10%)
    // 지역명 기반은 "맛집" 키워드가 없으면 너무 광범위하므로 "맛집"을 강제로 붙임
    if (type < 0.1) {
        const region = getRandomItem(REGION_KEYWORDS);
        const action = getRandomItem(ACTION_KEYWORDS);
        seed = `${region} 맛집 ${action}`;
        typeName = "A (Region)";
        sourceLabel = "Local Discovery";
    }
    // B Type: Channel + Action (45%)
    else if (type < 0.55) {
        const channel = getRandomItem(CONFIG.YOUTUBE_CHANNELS);
        const action = getRandomItem(ACTION_KEYWORDS);
        seed = `${channel} ${action}`;
        typeName = "B (Channel)";
        sourceLabel = channel;
    }
    // C Type: Broadcast + Action (45%)
    else {
        const broadcast = getRandomItem(CONFIG.BROADCAST_PROGRAMS);
        const action = getRandomItem(ACTION_KEYWORDS);
        // 방송명도 "맛집" 없으면 엉뚱한게 나오므로 추가
        seed = `${broadcast} 맛집 ${action}`;
        typeName = "C (Broadcast)";
        sourceLabel = broadcast;
    }

    return { seed, typeName, sourceLabel };
}

async function runRandomBatch() {
    console.log("🚀 [TubeMap v1.8] Random Batch Collection (20 Places) Started");
    const engine = new TubeMapEngine();
    const supabase = getSupabaseClient();

    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }

    let initialCount = 0;
    const { count: startCount } = await supabase.from('places').select('*', { count: 'exact', head: true });
    initialCount = startCount || 0;

    console.log(`📊 Initial DB Count: ${initialCount}`);

    let collected = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // Increased attempt limit for randomness

    while (collected < 20 && attempts < MAX_ATTEMPTS) {
        attempts++;

        // Generate Smart Seed
        const { seed, typeName, sourceLabel } = generateSeedKeyword();

        console.log(`\n[Attempt ${attempts}] 🎯 Strategy: ${typeName}`);
        console.log(`🔎 Searching for: ${seed}`);

        try {
            // Pass the sourceLabel so the engine knows what 'media_label' to save
            // NOTE: discoverAndProcess takes just one arg. We might need to split this
            // but for now, the engine extracts keywords from the video metadata anyway.
            // The 'sourceLabel' concept in the engine is derived from the query.
            await engine.discoverAndProcess(seed);
        } catch (e) {
            console.error(`❌ Error processing ${seed}:`, e);
        }

        // Check progress
        const { count: currentCount } = await supabase.from('places').select('*', { count: 'exact', head: true });
        collected = (currentCount || 0) - initialCount;

        console.log(`📈 Progress: ${collected} / 20 collected`);

        // Brief pause to respect API
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (collected >= 20) {
        console.log(`\n✅ Mission Accomplished: Collected ${collected} new places!`);
    } else {
        console.log(`\n⚠️ Finished after ${attempts} attempts with ${collected} places.`);
    }

    console.log("🏁 Batch Execution Finished.");
}

runRandomBatch().catch(err => {
    console.error("💥 Fatal Error in Batch:", err);
    process.exit(1);
});
