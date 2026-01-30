
/**
 * TubeMap Engine v1.6 Batch Runner
 * Collects 10 real places from diverse channels.
 */
import { TubeMapEngine } from '../src/lib/v3/engine/TubeMapEngine';
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// High quality targets based on user preference for variety
const TARGETS = [
    "성시경 먹을텐데 제주",
    "성시경 먹을텐데 강원",
    "성시경 먹을텐데 속초",
    "성시경 먹을텐데 부산 국밥"
];

// Note: Config has "백종원의 요리비책", but YouTube change channel names often. 
// "백종원 PAIK JONG WON" is current. The engine search is fuzzy enough? 
// Actually engine uses `searchVectors` which sends query to API. 
// So searching for "백종원 PAIK JONG WON" is safer.

async function runBatch() {
    console.log("🚀 [TubeMap v1.6] Batch Collection Started");
    const engine = new TubeMapEngine();
    const supabase = getSupabaseClient();

    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }

    let initialCount = 0;
    const { count: startCount } = await supabase.from('places').select('*', { count: 'exact', head: true });
    initialCount = startCount || 0;

    console.log(`📊 Initial DB Count: ${initialCount}`);

    for (const target of TARGETS) {
        console.log(`\n🎯 Processing Target: ${target}`);
        try {
            await engine.discoverAndProcess(target);
        } catch (e) {
            console.error(`❌ Error processing ${target}:`, e);
        }

        // Check progress
        const { count: currentCount } = await supabase.from('places').select('*', { count: 'exact', head: true });
        const collected = (currentCount || 0) - initialCount;

        console.log(`📈 Collected so far: ${collected} / 10 required`);

        if (collected >= 10) {
            console.log("✅ Collected 10+ new places. Stopping batch.");
            break;
        }

        // Brief pause to respect API rate limits slightly
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("🏁 Batch Execution Finished.");
}

runBatch();
