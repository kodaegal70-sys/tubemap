
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

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
    console.log("🚀 Starting FORCE DB RESET v2 (Service Role)...");

    try {
        // 1. places 삭제 (Cascade로 인해 하위 테이블도 다 삭제됨)
        // 조건을 .not('id', 'is', null) 로 변경하여 모든 행 선택
        const { count, error } = await db.from('places')
            .delete({ count: 'exact' })
            .not('id', 'is', null);

        if (error) {
            console.error("❌ Delete failed:", error);
        } else {
            console.log(`✅ Deleted ${count} places (and cascaded images/media).`);
        }

        // 2. processed_videos 삭제
        const { count: pvCount, error: pvError } = await db.from('processed_videos')
            .delete({ count: 'exact' })
            .not('video_id', 'is', null);

        if (pvError) {
            console.error("❌ processed_videos delete failed:", pvError);
        } else {
            console.log(`✅ Deleted ${pvCount} processed_videos.`);
        }

        // 3. Offline File 삭제
        const OFFLINE_FILE = path.join(process.cwd(), 'src/data/offline_places.json');
        if (fs.existsSync(OFFLINE_FILE)) {
            fs.writeFileSync(OFFLINE_FILE, '[]', 'utf-8');
            console.log("✅ Offline file (offline_places.json) emptied.");
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

forceReset();
