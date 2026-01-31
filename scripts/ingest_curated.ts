import { CuratedCollector } from '../src/lib/v3/engine/CuratedCollector';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

// Sample Input Format (can be replaced by reading a file)
const TARGET_LINKS: { youtube: string; kakao: string; }[] = [
    // { youtube: "...", kakao: "..." }
];

async function main() {
    console.log("🚀 Starting Curated Ingestion...");

    // Check if input argument or default file exists
    const argFile = process.argv[2];
    const defaultPasteFile = path.join(__dirname, 'paste_data.txt');

    let inputFile = '';
    if (argFile) inputFile = argFile;
    else if (fs.existsSync(defaultPasteFile)) inputFile = defaultPasteFile;

    let links: { youtube: string; kakao: string; }[] = TARGET_LINKS;

    if (inputFile) {
        try {
            console.log(`Loading data from ${inputFile}...`);
            const raw = fs.readFileSync(inputFile, 'utf-8');

            // Try parsing as JSON first
            try {
                const json = JSON.parse(raw);
                if (Array.isArray(json)) links = json;
            } catch {
                // Parse as TSV (Tab Separated Values) - Google Sheets Copy/Paste
                const lines = raw.split('\n');
                links = [];
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue; // Skip comments/empty

                    // Split by tab or multiple spaces
                    const parts = trimmed.split(/[\t\s]+/).filter(s => s.trim().length > 0);
                    if (parts.length >= 2) {
                        const youtube = parts.find(p => p.includes('youtube') || p.includes('youtu.be')) || '';
                        const kakao = parts.find(p => p.includes('kakao.com')) || '';

                        if (youtube && kakao) {
                            links.push({ youtube, kakao });
                        }
                    }
                }
            }
            console.log(`Loaded ${links.length} pairs from file.`);
        } catch (e: any) {
            console.error(`Failed to read input file: ${e.message}`);
            return;
        }
    }

    if (links.length === 0) {
        console.log("No valid links found.");
        console.log("1. Add links to TARGET_LINKS in this file, OR");
        console.log("2. Paste Google Sheet content into 'scripts/paste_data.txt', OR");
        console.log("3. Pass a JSON file path as an argument.");
        return;
    }

    const collector = new CuratedCollector();

    for (const [index, pair] of links.entries()) {
        console.log(`\n[${index + 1}/${links.length}] Processing...`);
        if (!pair.youtube || !pair.kakao) {
            console.warn("Skipping invalid pair:", pair);
            continue;
        }

        await collector.processLinkPair(pair.youtube, pair.kakao);

        // Rate limiting (politeness)
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n✅ Ingestion Complete!");
}

main().catch(console.error);
