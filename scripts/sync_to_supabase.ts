
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncOfflineData() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'offline_places.json');
    if (!fs.existsSync(filePath)) {
        console.log("No offline data file found.");
        return;
    }

    const offlineData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (offlineData.length === 0) {
        console.log("Offline data file is empty.");
        return;
    }

    console.log(`Syncing ${offlineData.length} places to Supabase...`);

    for (const place of offlineData) {
        const { error } = await supabase.from('places').upsert(place, { onConflict: 'kakao_place_id' });
        if (error) {
            console.error(`Failed to sync ${place.name}:`, error.message);
        } else {
            console.log(`Synced: ${place.name}`);
        }
    }

    console.log("Sync complete!");
}

syncOfflineData();
