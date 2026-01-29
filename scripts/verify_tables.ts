
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkTables() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error("❌ Supabase Client Failed");
        return;
    }

    console.log("🔍 Verifying v1.6 Tables...");

    // Check processed_videos
    const { error: pvError } = await supabase.from('processed_videos').select('video_id').limit(1);
    if (pvError) {
        console.error("❌ 'processed_videos' table MISSING or Error:", pvError.message);
    } else {
        console.log("✅ 'processed_videos' table exists.");
    }

    // Check review_queue
    const { error: rqError } = await supabase.from('review_queue').select('id').limit(1);
    if (rqError) {
        console.error("❌ 'review_queue' table MISSING or Error:", rqError.message);
    } else {
        console.log("✅ 'review_queue' table exists.");
    }

    // Check places (v1.6 fields)
    const { error: pError } = await supabase.from('places').select('image_state, best_comment_like_count').limit(1);
    if (pError) {
        console.error("❌ 'places' table missing v1.6 fields (best_comment_like_count, etc):", pError.message);
    } else {
        console.log("✅ 'places' table schema looks correct (checked image_state, best_comment_like_count).");
    }
}

checkTables();
