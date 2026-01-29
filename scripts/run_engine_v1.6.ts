/**
 * TubeMap Engine v1.6 Runner
 * Usage: npx tsx scripts/run_engine_v1.6.ts --target="성시경" --mode=channel
 */
import { TubeMapEngine } from '../src/lib/v3/engine/TubeMapEngine';
import { CONFIG } from '../src/lib/v3/engine/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
    console.log("🚀 [TubeMap v1.6] Engine Startup");

    const engine = new TubeMapEngine();

    // Parse Args (Simple)
    const args = process.argv.slice(2);
    const targetArg = args.find(a => a.startsWith('--target='));
    const target = targetArg ? targetArg.split('=')[1] : null;

    if (target) {
        // Manual Run
        console.log(`🎯 Target: ${target}`);
        await engine.discoverAndProcess(target);
    } else {
        // Default: Use Auto Seed Generation
        console.log(`🎲 Auto-Mode: Generating combinatorial seeds...`);
        await engine.discoverAndProcess();
    }

    console.log("✅ [TubeMap v1.6] Execution Finished.");
}

main().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
