
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
    process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey);

async function checkRow() {
    console.log("🔍 Checking columns...");
    const { data, error } = await db.from('places').select('*').limit(1);

    if (error) {
        console.error("❌ Fetch error:", error);
    } else {
        if (data && data.length > 0) {
            console.log("✅ Columns:", JSON.stringify(Object.keys(data[0])));
        } else {
            console.log("✅ Table exists but empty.");
        }
    }
}

checkRow();
