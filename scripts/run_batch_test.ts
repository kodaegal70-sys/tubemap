/**
 * TubeMap Engine v1.6 Batch Tester
 * Runs discovery for 10 diverse targets to verify logic robustness.
 */
import { TubeMapEngine } from '../src/lib/v3/engine/TubeMapEngine';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const TARGETS = [
    "성시경 먹을텐데",      // 1. Benchmark: High Quality
    "최자로드",             // 2. Benchmark: High Quality
    "또간집",               // 3. Program: Specific extraction
    "쯔양 맛집",            // 4. Challenge: Often fails extraction
    "맛있는 녀석들",        // 5. Program: TV Show
    "백종원 시장",          // 6. Celebrity
    "줄서는식당",           // 7. Program
    "김사원세끼",           // 8. YouTuber
    "고기 먹방",            // 9. Generic Category
    "전지적 참견 시점"      // 10. TV Show
];

async function runBatch() {
    console.log("🚀 [TubeMap v1.6] Starting Batch Test (10 Targets)");
    const engine = new TubeMapEngine();

    for (const target of TARGETS) {
        console.log(`\n================================`);
        console.log(`🎯 Batch Target: ${target}`);
        console.log(`================================`);
        try {
            await engine.discoverAndProcess(target);
        } catch (e) {
            console.error(`❌ Error processing ${target}:`, e);
        }

        // Brief pause to respect API limits slightly
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n✅ [TubeMap v1.6] Batch Test Finished.");
}

runBatch();
