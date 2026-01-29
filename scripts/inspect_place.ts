
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function inspectPlace() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('places')
        .select('*')
        .ilike('name', '%중앙해장%'); // Search for Jungang Haejang

    if (error) {
        console.error("❌ DB Error:", error.message);
    } else {
        data?.forEach(p => {
            console.log(`\n🔍 Place: ${p.name}`);
            console.log(`   Video URL: ${p.video_url || 'N/A'}`);
            console.log(`   Media Label: ${p.media_label || p.media}`);
            // Note: We might not store the full video title in 'places' table, 
            // but we can infer it or checking 'processed_videos' if we had the ID.
            // For now, let's see what we have.
        });
    }
}

inspectPlace();
