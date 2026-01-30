
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function resetVideos() {
    const db = getSupabaseClient();
    if (!db) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }
    console.log("Resetting processed videos...");

    // Reset all for simplicity in test env, or target specific IDs if possible.
    // Let's just delete from processed_videos where we want to re-test.
    // Dangerous in prod, but fine for this dev task.

    // Clear dependent tables first
    // Clear dependent tables first
    const { error: errImg } = await db.from('images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errImg) console.log("Images clear warning:", errImg.message);

    const { error: errPlace } = await db.from('places').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errPlace) console.log("Places clear warning:", errPlace.message);

    const { error } = await db.from('processed_videos').delete().neq('video_id', 'dummy');

    if (error) console.error("Error resetting:", error);
    else console.log("Reset complete. DB processed_videos cleared.");

    // Clear Offline File
    const fs = require('fs');
    const path = require('path');
    const OFFLINE_FILE = path.join(process.cwd(), 'src/data/offline_places.json');
    if (fs.existsSync(OFFLINE_FILE)) {
        fs.writeFileSync(OFFLINE_FILE, '[]', 'utf-8');
        console.log("Offline file (offline_places.json) has been emptied.");
    }
}

resetVideos();
