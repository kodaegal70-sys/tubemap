
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
    console.log("🚀 Starting FORCE DB RESET v3 (Fetch & Delete)...");

    try {
        // 1. Places ID 조회
        const { data: places, error: fetchError } = await db.from('places').select('id');
        if (fetchError) {
            console.error("❌ Fetch failed:", fetchError);
            return;
        }

        if (!places || places.length === 0) {
            console.log("✅ No places to delete.");
        } else {
            console.log(`🔍 Found ${places.length} places to delete.`);
            const ids = places.map(p => p.id);

            // 2. Places 삭제 (Cascade로 하위 테이블 삭제됨)
            const { error: deleteError } = await db.from('places').delete().in('id', ids);
            if (deleteError) {
                console.error("❌ Delete failed:", deleteError);
            } else {
                console.log(`✅ Successfully deleted ${ids.length} places.`);
            }
        }

        // 3. Processed Videos 삭제
        // (Video ID 조회)
        const { data: videos } = await db.from('processed_videos').select('video_id');
        if (videos && videos.length > 0) {
            const vIds = videos.map(v => v.video_id);
            await db.from('processed_videos').delete().in('video_id', vIds);
            console.log(`✅ Deleted ${vIds.length} processed_videos.`);
        } else {
            console.log("✅ No processed_videos to delete.");
        }

        // 4. Offline File 삭제
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
