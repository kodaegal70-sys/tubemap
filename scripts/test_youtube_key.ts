
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.join(process.cwd(), '.env.local');
console.log(`[Test] Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

const apiKey = process.env.YOUTUBE_API_KEY;

console.log(`[Test] YOUTUBE_API_KEY present: ${!!apiKey}`);
if (apiKey) {
    console.log(`[Test] Key Length: ${apiKey.length}`);
    console.log(`[Test] Key Start: ${apiKey.substring(0, 5)}...`);
    // Check for whitespace
    if (apiKey.trim() !== apiKey) {
        console.error("[Test] WARNING: API Key has leading/trailing whitespace!");
    }
} else {
    console.error("[Test] Key is missing!");
    process.exit(1);
}

const youtube = google.youtube('v3');

async function testKey() {
    try {
        console.log("[Test] Attempting to fetch video details...");
        const response = await youtube.videos.list({
            key: apiKey,
            part: ['snippet'],
            id: ['Ks_t_7J8aIQ'] // Generic test video ID
        });

        console.log("[Test] Response Status:", response.status);
        if (response.data.items && response.data.items.length > 0) {
            console.log("[Test] Success! Found video:", response.data.items[0].snippet?.title);
        } else {
            console.log("[Test] Success (Empty): No items found (Key works, ID might be wrong or restricted)");
        }
    } catch (error: any) {
        console.error("[Test] API Call Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testKey();
