import { createClient } from "@supabase/supabase-js";
export function createSupabaseServerClient(env = process.env, clientFactory = createClient) {
  const url = env?.SUPABASE_URL; const key = env?.SUPABASE_SECRET_KEY;
  if (typeof url !== "string" || !url || typeof key !== "string" || !key.trim() || typeof clientFactory !== "function") return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return clientFactory(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  } catch { return null; }
}
