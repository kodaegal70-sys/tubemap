
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using Anon key for client ops or Service Role if RLS allows
// Note: Schema changes usually require Service Role Key or running SQL directly via Dashboard.
// However, since we don't have the Service Key in .env.local (usually), 
// we will try to use the 'rpc' method if a function exists, or just use the user credentials if possible.
// Wait, the previously used `run_sql_migration.js` failed because of missing connection string.

// Let's try to infer if we can use postgres.js with a constructed connection string, 
// OR simpler: Since we have the Supabase Client, let's see if we can just use the provided SQL file logic?
// The user said "supabase is under maintenance", but local dev might be fine?
// Ah, the user checked "supabase is under maintenance". 

// Okay, if Supabase is down/maintenance, we can't migrate. 
// BUT, if we are running against LOCAL supabase or just assuming it's available...
// Let's try to fix the `run_sql_migration.js` first by providing a valid connection string if possible?
// Actually, `NEXT_PUBLIC_SUPABASE_URL` is `https://shunjsvozfpebengziqh.supabase.co`. This is a hosted instance.
// If it's in maintenance, we are stuck.

// BUT, the previous error `DB 연결 문자열을 찾을 수 없습니다` suggests the script needs `DATABASE_URL`.
// Using `node-postgres` requires a connection string like `postgres://user:pass@host:port/db`.
// We don't have the password in `.env.local`.

// ALTERNATIVE:
// If the table was created recently by `v1.6_engine_schema.sql`, verify if `menu_primary` line was actually executed.
// If the table ALREADY EXISTED, the `CREATE TABLE IF NOT EXISTS` would skip.
// We need to run the `ALTER TABLE` commands explicitly.

// I will create a small script that uses the existing `getSupabaseClient` to try and insert a dummy row to CHECK 
// if the column exists. If it fails, we know for sure.
// If it fails, how do we add column without Console? 
// We generally can't without Service Key or SQL Editor. 
// User asked to check SQL editor content.
// User said "sql 에디터 내용 한번 줄까?" -> I asked for it.
// User said "잠간만 supabase가 점검중이네".

// CRITICAL: If Supabase is in maintenance, we might not be able to write to it at all.
// But the batch script just ran and collected 4 places (saw in logs: `Progress: 4 / 20 collected`).
// So the DB IS UP and WRITABLE.
// The error `Could not find the 'menu_primary' column` came from Postgrest (Supabase API).
// This means the API thinks the column is missing.
// It's likely the Local Schema Cache of Postgrest needs a reload or the column is truly missing.

// STRATEGY: 
// 1. Try to "refresh" the schema cache if possible (by making a schema change via SQL if we could).
// 2. Since we can't run SQL directly (no connection string), and Console is down...
// 3. WAIT. If I can't change schema, I can't fix `menu_primary` error properly.
// EXCEPT: The user said "아까 수정했는데 엔진에 반영안됐나보다".
// If the user added it in SQL Editor, maybe we just need to wait or restart the connection?
// No, Supabase API acts immediately usually.

// Let's try to inspect the columns using the Supabase Client (RPC or just metadata query?).
// We can query `information_schema`.
// AND if it's missing, we are stuck unless we have SQL access. 

// HOWEVER, I CAN CONTINUE COLLECTION if I map `menu` to `description` as a fallback?
// User said: "지금 임의의 필드명으로 가져오면 ui랑 연계가 안되니까 절대로 그렇게 하면안되".
// So I MUST use `menu_primary`.

// Let's verify if `menu_primary` exists by querying `information_schema.columns`.
// If it implies it's missing, I will ask user for the Service Key or to run SQL when maintenance ends.
// But wait, are we sure it's missing? The error `Could not find the 'menu_primary' column` is very explicit.

// What if I try to run the migration using the `postgres` library but guessing the password? No.
// What if I try to use the `rpc` call `exec_sql` if it exists? (Some setups have it).

// Let's first Diagnose.
import { getSupabaseClient } from '../src/lib/supabaseClient';

async function checkColumn() {
    const supabase = getSupabaseClient();

    // Check if column exists in schema
    // Postgrest doesn't let us query information_schema easily unless exposed.
    // Try to select the column from one row.
    const { data, error } = await supabase
        .from('places')
        .select('menu_primary')
        .limit(1);

    if (error) {
        console.error("❌ Diagnosis: Column 'menu_primary' query failed:");
        console.error(error);

        // Check exact error code
        // 42703 = undefined_column
    } else {
        console.log("✅ Diagnosis: Column 'menu_primary' exists and is readable.");
    }
}

checkColumn();
