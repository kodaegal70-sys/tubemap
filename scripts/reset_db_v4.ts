
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

const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function forceReset() {
    console.log("🚀 Starting FORCE DB RESET v4 (Using updated_at)...");

    try {
        // 1. Places 삭제 (Cascade로 하위 테이블 삭제됨)
        // id 컬럼 이슈 회피를 위해 updated_at 기준으로 삭제
        const { count, error } = await db.from('places')
            .delete({ count: 'exact' })
            .gt('updated_at', '1970-01-01T00:00:00Z');

        if (error) {
            console.error("❌ Delete failed:", error);
        } else {
            console.log(`✅ Deleted ${count} places.`);
        }

        // 2. Processed Videos 삭제
        // processed_at 기준으로 삭제 (만약 존재한다면)
        // 없는 경우 status가 존재하므로 status 기준으로 삭제
        const { count: pvCount, error: pvError } = await db.from('processed_videos')
            .delete({ count: 'exact' })
            .not('status', 'is', null);

        if (pvError) {
            console.error("❌ processed_videos delete failed:", pvError);
        } else {
            console.log(`✅ Deleted ${pvCount} processed_videos.`);
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

forceReset();
