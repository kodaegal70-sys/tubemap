import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking latest places...");
    const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Supabase Error Message:", error.message);
    } else {
        console.log(`Found ${data.length} places.`);
        data.forEach((p: any) => {
            console.log("---------------------------------------------------");
            console.log(`[${p.name}] ID: ${p.id} / KakaoID: ${p.kakao_place_id}`);
            console.log(` Channels: ${p.channels}`);
            console.log(` Coordinates: ${p.lat}, ${p.lng}`);
            console.log(` Menu Image: ${p.menu_image_url ? p.menu_image_url.substring(0, 50) + "..." : "MISSING"}`);
            // Check for potential ghost data
            if (p.channels && p.channels.includes("쯔양")) {
                console.log("!!! GHOST CHANNEL DETECTED: 쯔양 !!!");
            }
        });
    }
}

main();
