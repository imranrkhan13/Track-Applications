import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const authStorageKey = supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token` : "career-garden-auth";
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { storageKey: authStorageKey, flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
    : null;

export const DEMO_USER = {
    id: "demo-user",
    email: "demo@trackapplications.app",
    user_metadata: { full_name: "Demo User", avatar_url: "" },
};
