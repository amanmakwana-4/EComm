
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  // Do not throw during build — warn so deployments with missing envs are obvious.
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not set. Supabase client will be created with undefined values.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Only reference localStorage when running in the browser
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Expose client to window in dev for quick debugging from the browser console.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__supabase = supabase;
  window.supabase = supabase; // convenience for interactive debugging
}
