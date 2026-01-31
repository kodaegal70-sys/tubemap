import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking session and fetching one row to see columns...");
    const { data, error } = await supabase.from('places').select('*').limit(1);

    if (error) {
        console.error("Error fetching schema sample:", error.message);
    } else if (data && data.length > 0) {
        console.log("Found row! Columns are:", Object.keys(data[0]));
    } else {
        console.log("Table is empty. Cannot determine columns via select *.");
    }
}

checkSchema();
