import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════
   Supabase Client Initialization
   Browser client for auth, storage, and realtime
   ═══════════════════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Browser client (public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client factory (for API routes / Server Components)
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
