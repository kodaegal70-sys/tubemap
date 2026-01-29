const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMigration() {
    console.log("🔍 Checking database schema version...");

    // Try to select the new v1.5 column 'image_state'
    const { data, error } = await supabase
        .from('places')
        .select('image_state')
        .limit(1);

    if (error) {
        // If error code is 'PGRST100' (undefined column) or 404, it means migration is not done.
        // Or if table doesn't exist.
        console.log("❌ Migration Check Failed:", error.message, error.code);
    } else {
        console.log("✅ Migration Confirmed: 'image_state' column exists.");
    }
}

checkMigration();
