import { createClient } from "@supabase/supabase-js";
let defaultBrowserClient;
export function createSupabaseBrowserClient(env = import.meta.env) {
  const url=env?.VITE_SUPABASE_URL;const key=env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return null;
  if(env===import.meta.env){
    defaultBrowserClient ||= createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return defaultBrowserClient;
  }
  return createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}
