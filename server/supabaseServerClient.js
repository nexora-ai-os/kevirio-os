import { createClient } from "@supabase/supabase-js";
export function createSupabaseServerClient(env = process.env) { const url = env?.SUPABASE_URL; const key = env?.SUPABASE_SECRET_KEY; if (!url || !key) return null; return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }); }
