
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Supabase client requires a valid absolute URL.
  // We use the proxy '/supabase', but we must prepend the origin.
  const supabaseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/supabase`
    : process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/supabase`
      : 'http://localhost:3000/supabase'; // Default fallback for SSR

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );
}
