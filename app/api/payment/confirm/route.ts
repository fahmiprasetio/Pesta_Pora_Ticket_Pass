import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Confirm a paid order without relying on the Midtrans webhook.
// The browser calls this from Snap's onSuccess callback. We never trust the
// client blindly: the real transaction status is re-checked from Midtrans
// first, so an order is only confirmed when Midtrans says it is paid.
export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) {
    return NextResponse.json({ error: "Server key is not set." }, { status: 500 });
  }
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION?.trim() === "true";
  const apiBase = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  let body: { orderId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const orderId = String(body.orderId ?? "");
  if (!orderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Look up the internal order to find its Midtrans payment reference.
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, payment_ref")
      .eq("id", orderId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (order.status === "confirmed") {
      return NextResponse.json({ status: "confirmed" });
    }
    const paymentRef = order.payment_ref as string | null;
    if (!paymentRef) {
      return NextResponse.json({ status: order.status });
    }

    // Re-check the real transaction status straight from Midtrans.
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const statusRes = await fetch(`${apiBase}/${paymentRef}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
    });
    const statusJson = await statusRes.json();
    const transactionStatus = String(statusJson?.transaction_status ?? "");
    const fraudStatus = String(statusJson?.fraud_status ?? "");
    const paid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept");

    if (paid) {
      await supabase.rpc("confirm_paid_order", { p_payment_ref: paymentRef });
      return NextResponse.json({ status: "confirmed" });
    }
    return NextResponse.json({ status: transactionStatus || order.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
