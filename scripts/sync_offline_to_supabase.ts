import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Insert 권한 필요
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * [동기화] offline_places.json의 데이터를 Supabase DB에 Upsert
 */
async function main() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`[Sync] Found ${places.length} items in offline file. Starting sync...`);

    let successCount = 0;
    let failCount = 0;

    for (const place of places) {
        // DB 스키마에 맞게 매핑
        const { error } = await supabase
            .from('curated_places')
            .upsert({
                kakao_place_id: place.kakao_place_id,
                name: place.name,
                name_official: place.name_official,
                category: place.category,
                address: place.address,
                road_address: place.road_address,
                lat: place.lat,
                lng: place.lng,
                phone: place.phone,
                channel_title: place.channel_title,
                media_label: place.media_label || place.channel_title,
                video_url: place.video_url,
                video_id: place.video_id,
                video_thumbnail_url: place.video_thumbnail_url,
                best_comment: place.best_comment,
                best_comment_like_count: place.best_comment_like_count,
                menu_primary: place.menu_primary,
                image_url: place.image_url,
                image_state: place.image_state || 'approved',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'kakao_place_id'
            });

        if (error) {
            console.error(`   ❌ Failed: ${place.name}`, error.message);
            failCount++;
        } else {
            successCount++;
        }
    }

    console.log(`\n[Sync] Finished.`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
}

main().catch(console.error);
