
import { getSupabaseClient } from '../src/lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function cleanup() {
    const supabase = getSupabaseClient();

    // Delete known bad names
    const badNames = ['ENG', '소풍LIVE', 'undefined', 'null'];
    const { count } = await supabase
        .from('places')
        .delete({ count: 'exact' })
        .in('name', badNames);

    console.log(`🗑️ Deleted ${count} bad data entries.`);

    // Delete very short names (likely extraction errors)
    const { data: shortPlaces } = await supabase.from('places').select('id, name');
    const toDelete = shortPlaces?.filter(p => p.name.length < 2).map(p => p.id) || [];

    if (toDelete.length > 0) {
        await supabase.from('places').delete().in('id', toDelete);
        console.log(`🗑️ Deleted ${toDelete.length} short name entries.`);
    }
}

cleanup();
