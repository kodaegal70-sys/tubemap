
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function deletePlace() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error("Supabase client not initialized. Check env vars or initialization logic.");
    }

    const { data, error } = await supabase
        .from('places')
        .delete({ count: 'exact' })
        .ilike('name', '%중앙해장%');

    if (error) {
        console.error("❌ DB Error:", error.message);
    } else {
        console.log(`🗑️ Deleted Jungang Haejang place(s).`);
    }
}

deletePlace();
