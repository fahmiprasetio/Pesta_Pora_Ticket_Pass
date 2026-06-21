import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
