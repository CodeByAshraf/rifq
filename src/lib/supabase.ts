import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Only the public anon key is used here; access is enforced
 * by Row Level Security (see supabase/migrations). Never put the service-role key in
 * the app or in any RIFQ_ variable.
 */
const url = process.env.RIFQ_SUPABASE_URL;
const anon = process.env.RIFQ_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const supabaseConfigured = Boolean(url && anon);

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) client = createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}
