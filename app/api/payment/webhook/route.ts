import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Midtrans notification webhook. Source of truth for payment status.
// Verify signature: sha512(order_id + status_code + gross_amount + serverKey).
export async function POST(request: NextRequest) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) {
    return NextResponse.json({ error: "Server key is not set." }, { status: 500 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const signature = String(body.signature_key ?? "");
  const transactionStatus = String(body.transaction_status ?? "");
  const fraudStatus = String(body.fraud_status ?? "");

  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer();
    const paid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept");
    const failed =
      transactionStatus === "expire" ||
      transactionStatus === "cancel" ||
      transactionStatus === "deny";

    if (paid) {
      await supabase.rpc("confirm_paid_order", { p_payment_ref: orderId });
    } else if (failed) {
      await supabase.rpc("release_order", { p_payment_ref: orderId });
    }
    // other statuses (pending) are left as-is.

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
