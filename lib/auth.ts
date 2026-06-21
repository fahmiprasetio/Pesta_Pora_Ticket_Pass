import { getSupabaseBrowser } from "@/lib/supabaseClient";

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ needsConfirmation: boolean }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName }),
  });
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(payload.error || "Gagal mendaftar.");
  }
  // Akun dibuat dan langsung di-confirm di server, jadi langsung buat sesi.
  await signIn(email, password);
  return { needsConfirmation: false };
}

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = getSupabaseBrowser();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as Profile | null) ?? null;
}
