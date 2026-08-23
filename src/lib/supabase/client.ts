import { createBrowserClient } from '@supabase/ssr';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-url')
);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (typeof window !== 'undefined') {
    if (!browserClient) {
      browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return browserClient;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
