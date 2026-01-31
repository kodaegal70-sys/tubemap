
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Key missing");
    process.exit(1);
}

const db = createClient(supabaseUrl, serviceRoleKey);

async function syncDb() {
    console.log("🚀 Syncing DB with offline_places.json...");

    // 1. 오프라인 파일 로드
    const offlinePath = path.join(process.cwd(), 'src/data/offline_places.json');
    if (!fs.existsSync(offlinePath)) {
        console.error("❌ offline_places.json not found!");
        return;
    }
    const offlineData = JSON.parse(fs.readFileSync(offlinePath, 'utf-8'));
    const validIds = offlineData.map((p: any) => p.kakao_place_id).filter((id: string) => !!id);

    console.log(`📂 Offline Valid IDs (${validIds.length}):`, validIds);

    // 2. DB에서 유효하지 않은 ID 삭제
    // .not('kakao_place_id', 'in', `(${validIds.join(',')})`)  <-- Supabase syntax is subtle
    // Safer approach: Get all IDs from DB, find difference in JS, then delete by ID list.
    // ID 컬럼 문제로 인해 kakao_place_id 만 조회 및 사용

    const { data: allPlaces, error: fetchError } = await db.from('places').select('kakao_place_id, name');
    if (fetchError) {
        console.error("❌ DB Fetch Error:", fetchError);
        return;
    }

    const toDelete = allPlaces.filter(p => !validIds.includes(p.kakao_place_id));

    if (toDelete.length === 0) {
        console.log("✅ DB is already synced (No extra data).");
        return;
    }

    console.log(`🗑️ Found ${toDelete.length} zombie items in DB:`);
    toDelete.forEach(p => console.log(`   - [${p.kakao_place_id}] ${p.name}`));

    const deleteIds = toDelete.map(p => p.kakao_place_id);
    const { error: deleteError } = await db.from('places').delete().in('kakao_place_id', deleteIds);

    if (deleteError) {
        console.error("❌ DB Delete Error:", deleteError);
    } else {
        console.log(`✅ Successfully deleted ${toDelete.length} items from DB.`);
    }
}

syncDb();
