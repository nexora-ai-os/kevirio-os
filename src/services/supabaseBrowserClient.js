import { createClient } from "@supabase/supabase-js";
export function createSupabaseBrowserClient(env = import.meta.env) { const url = env?.VITE_SUPABASE_URL; const key = env?.VITE_SUPABASE_PUBLISHABLE_KEY; if (!url || !key) return null; return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }); }
