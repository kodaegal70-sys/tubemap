
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Key missing");
    process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey);

async function checkIds() {
    console.log("🔍 Checking DB status...");
    const { data, error } = await db.from('places').select('name, kakao_place_id');

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log(`✅ Total Rows in DB: ${data.length}`);
        if (data.length > 0) {
            console.log("--- List ---");
            data.forEach(p => console.log(`[${p.kakao_place_id}] ${p.name}`));
            console.log("------------");
        }
    }
}

checkIds();
