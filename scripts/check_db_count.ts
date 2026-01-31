
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkCount() {
    const db = getSupabaseClient();
    if (!db) throw new Error("Supabase client init failed");

    const { count, error } = await db.from('places').select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error checking count:", error);
    } else {
        console.log(`Current 'places' row count: ${count}`);
    }
}

checkCount();
