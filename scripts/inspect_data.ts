
import { getSupabaseClient } from './src/lib/supabaseClient';

async function checkData() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('places').select('*').limit(1).order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        const p = data[0];
        console.log('--- Inspector Result ---');
        console.log('ID:', p.id);
        console.log('Name:', p.name);
        console.log('media:', p.media);
        console.log('media_label:', p.media_label);
        console.log('------------------------');
    } else {
        console.log('No data found in places table.');
    }
}

checkData();
