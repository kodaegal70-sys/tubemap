
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanup() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }

    // 1. Delete items with pending images
    const { error: err1, count } = await supabase
        .from('places')
        .delete({ count: 'exact' })
        .neq('image_state', 'approved');

    if (err1) console.error("Error deleting pending images:", err1);
    else console.log(`🗑️ Deleted ${count} places with no images (pending).`);

    // 2. Delete items with no media info (Suspicious)
    const { error: err2, count: count2 } = await supabase
        .from('places')
        .delete({ count: 'exact' })
        .is('media', null);

    if (err2) console.error("Error deleting null media:", err2);
    else console.log(`🗑️ Deleted ${count2} places with null media.`);
}

cleanup();
