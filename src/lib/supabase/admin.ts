import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client authenticated with the service role key.
 * Bypasses RLS — NEVER import this from a client component; it must only be
 * used inside API routes / server code (webhooks, background jobs).
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured — privileged server operations are unavailable'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
