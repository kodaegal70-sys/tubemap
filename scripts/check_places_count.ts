
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkCount() {
    const supabase = getSupabaseClient();

    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }

    const { data, error } = await supabase
        .from("places")
        .select("id, name, media, media_label, image_url, image_state");

    if (error) {
        console.error("❌ DB Error:", error.message);
    } else {
        console.log(`📊 Total Places: ${data?.length}`);
        data?.forEach(p => {
            console.log(`[ID: ${p.id}] Name: ${p.name} | Media: ${p.media_label || p.media} | State: ${p.image_state} | Img: ${p.image_url ? 'Has URL' : 'NULL'}`);
        });
    }
}

checkCount();
