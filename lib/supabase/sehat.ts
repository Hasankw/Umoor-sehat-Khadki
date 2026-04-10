import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export function getSehatClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : FALLBACK_URL;
  const key =
    (process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0) > 20
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) > 20
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : FALLBACK_KEY;
  return createClient(url, key);
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
