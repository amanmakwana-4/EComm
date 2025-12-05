
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Expose client to window in dev for quick debugging from the browser console.
// This avoids making it available in production builds.
if (import.meta.env.DEV && typeof window !== "undefined") {
  // Attach under a non-conflicting name and the short name for convenience
  window.__supabase = supabase;
  window.supabase = supabase; // convenience for interactive debugging
}
