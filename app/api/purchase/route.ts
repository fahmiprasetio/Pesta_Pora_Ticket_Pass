import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // If productId is not sent (e.g. from a load test), grab the first product.
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
        { error: "Product not found." },
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
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
