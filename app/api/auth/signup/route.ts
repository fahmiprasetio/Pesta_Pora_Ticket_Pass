import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

// Jalankan di Node runtime karena memakai service role key.
export const runtime = "nodejs";

type SignupBody = {
  email?: string;
  password?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Body permintaan tidak valid." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.fullName ?? "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Kata sandi minimal 6 karakter." },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch {
    return NextResponse.json(
      { error: "Server Supabase belum dikonfigurasi." },
      { status: 500 }
    );
  }

  // Buat user langsung dari server dan tandai email sudah terkonfirmasi,
  // sehingga tidak bergantung pada pengiriman email konfirmasi Supabase.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const msg = error.message || "Gagal membuat akun.";
    const alreadyExists = /already|registered|exists|duplicate/i.test(msg);
    return NextResponse.json(
      {
        error: alreadyExists
          ? "Email sudah terdaftar. Silakan masuk."
          : msg,
      },
      { status: alreadyExists ? 409 : 400 }
    );
  }

  return NextResponse.json({ ok: true, userId: data.user?.id ?? null });
}
