import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => ({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
});

export const getSupabaseClient = () => {
    const { url, key } = getSupabaseConfig();
    if (url === 'https://placeholder.supabase.co') return null;
    return createClient(url, key);
};

export const supabase = getSupabaseClient();
