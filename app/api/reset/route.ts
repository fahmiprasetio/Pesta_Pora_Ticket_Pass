import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Reset demo: kembalikan stok ke penuh dan hapus order.
// Dilindungi token admin (ADMIN_RESET_TOKEN) supaya tidak bisa dipicu sembarang
// orang. Eksekusi pakai service role lewat RPC reset_demo().
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_RESET_TOKEN;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "ADMIN_RESET_TOKEN belum diset di environment. Tambahkan dulu untuk mengaktifkan reset.",
      },
      { status: 403 }
    );
  }

  let body: { token?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const headerToken = request.headers.get("x-reset-token") ?? "";
  const token = body.token ?? headerToken;

  if (token !== expected) {
    return NextResponse.json(
      { error: "Token admin tidak valid." },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc("reset_demo");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kesalahan tak terduga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
