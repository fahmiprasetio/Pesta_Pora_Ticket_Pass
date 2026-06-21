import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client sisi server memakai service role key. JANGAN pernah diimpor di
// komponen client. Dibuat lazy agar build tidak gagal saat env belum ada.
let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Environment Supabase belum lengkap: butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
