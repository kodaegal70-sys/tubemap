
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function listVideos() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }
    const { data: videos, error } = await supabase
        .from('processed_videos')
        .select('*');

    if (error) {
        console.error("❌ DB Error:", error.message);
    } else {
        console.log(`📊 Found ${videos?.length} Processed Videos`);
        videos?.forEach(v => {
            console.log(`[${v.video_id}] Title: ${v.title} (Status: ${v.status})`);
        });
    }
}

listVideos();
