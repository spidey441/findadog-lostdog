import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "your-project-url" &&
  supabaseAnonKey !== "your-anon-key";

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const isSupabaseConfigured = Boolean(hasSupabaseConfig);
