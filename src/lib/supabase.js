import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check .env.local');
}

const getLock = () => {
    // Si estamos en el navegador y soporta Web Locks API, dejamos que Supabase use el por defecto (undefined)
    if (typeof navigator !== 'undefined' && navigator.locks) {
        return undefined;
    }
    // Fallback para SSR o navegadores que no lo soporten
    return async (name, acquireTimeout, fn) => {
        return await fn();
    };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: getLock(),
    }
});
