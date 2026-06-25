import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Verifikasi token akses (bila ada) lalu kembalikan id user yang sah.
// Tidak pernah mempercayai id mentah dari client: id diambil dari token.
async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    let body: { productId?: string; buyerToken?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    let productId = body.productId;
    const buyerToken = body.buyerToken ?? globalThis.crypto.randomUUID();
    const userId = await resolveUserId(request);

    // Jika productId tidak dikirim (mis. dari load test), ambil produk pertama.
    if (!productId) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      productId = product?.id;
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase.rpc("purchase_ticket", {
      p_product_id: productId,
      p_buyer_token: buyerToken,
      p_user_id: userId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, buyer_token: buyerToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kesalahan tak terduga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
