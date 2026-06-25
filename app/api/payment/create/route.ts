import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VerifiedUser = { id: string; email: string | null };

async function resolveUser(request: NextRequest): Promise<VerifiedUser | null> {
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
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return NextResponse.json(
      { error: "MIDTRANS_SERVER_KEY is not set in the environment." },
      { status: 500 }
    );
  }
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapBase = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

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
    const verified = await resolveUser(request);

    if (!productId) {
      const { data: first } = await supabase
        .from("products")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      productId = first?.id;
    }
    if (!productId) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // 1) Lock the stock slot (atomic) -> pending order.
    const { data: reserve, error: reserveError } = await supabase.rpc(
      "reserve_ticket",
      {
        p_product_id: productId,
        p_buyer_token: buyerToken,
        p_user_id: verified?.id ?? null,
      }
    );
    if (reserveError) {
      return NextResponse.json({ error: reserveError.message }, { status: 500 });
    }

    const status = reserve?.status as string;
    const orderId = reserve?.order_id as string | null;
    const remaining = (reserve?.remaining_stock as number) ?? 0;

    if (status === "sold_out") {
      return NextResponse.json({
        status: "sold_out",
        order_id: null,
        remaining_stock: remaining,
        message: "Tickets are sold out.",
      });
    }
    if (status === "confirmed") {
      return NextResponse.json({
        status: "confirmed",
        order_id: orderId,
        remaining_stock: remaining,
        already_reserved: true,
        message: "This ticket was already paid for.",
      });
    }
    if (!orderId) {
      return NextResponse.json(
        { error: "Failed to secure the ticket slot." },
        { status: 500 }
      );
    }

    // 2) Fetch product price and name for gross_amount.
    const { data: product } = await supabase
      .from("products")
      .select("name, price")
      .eq("id", productId)
      .maybeSingle();
    const amount = Math.round(Number(product?.price ?? 0));
    const productName = (product?.name as string) ?? "Lonjak Ticket";

    // 3) Unique order_id for Midtrans (still maps to the internal order).
    const midtransOrderId = `LONJAK-${orderId.slice(0, 8)}-${Date.now()}`;
    await supabase.rpc("set_payment_ref", {
      p_order_id: orderId,
      p_payment_ref: midtransOrderId,
    });

    // 4) Create the Snap transaction via the Midtrans REST API.
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const snapRes = await fetch(snapBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: amount,
        },
        item_details: [
          { id: productId, price: amount, quantity: 1, name: productName },
        ],
        customer_details: verified?.email
          ? { email: verified.email }
          : undefined,
        credit_card: { secure: true },
      }),
    });
    const snapJson = await snapRes.json();
    if (!snapRes.ok || !snapJson.token) {
      // Transaction creation failed: release the slot so stock is not stuck.
      await supabase.rpc("release_order", { p_payment_ref: midtransOrderId });
      const detail = Array.isArray(snapJson?.error_messages)
        ? snapJson.error_messages.join(", ")
        : "Failed to create the Midtrans transaction.";
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json({
      status: "pending",
      order_id: orderId,
      remaining_stock: remaining,
      snap_token: snapJson.token,
      message: "Slot secured, continue to payment.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
