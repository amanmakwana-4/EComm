import { createClient } from "@supabase/supabase-js";

let supabase;

export function getSupabaseClient() {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("❌ Supabase env vars missing");
    return null; // <-- IMPORTANT for dev
  }

  if (typeof window === "undefined") return null;

  supabase = createClient(url, key, {
    auth: {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  if (import.meta.env.DEV) {
    window.supabase = supabase;
  }

  return supabase;
}
