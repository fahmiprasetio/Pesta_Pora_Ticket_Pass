import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProductInfo = {
  name: string | null;
  tier: string | null;
  venue: string | null;
};

// Public gate verification. Used by staff scanning the e-ticket QR.
// Reads with the service role so anyone at the gate can check validity,
// but only returns minimal info and never exposes buyer identity.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { valid: false, reason: "missing_id" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, status, payment_status, created_at, product:products(name, tier, venue)"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { valid: false, reason: "not_found" },
        { status: 404 }
      );
    }

    const rawProduct = (
      data as { product: ProductInfo | ProductInfo[] | null }
    ).product;
    const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
    const valid = data.status === "confirmed";

    return NextResponse.json({
      valid,
      status: data.status,
      payment_status: data.payment_status ?? null,
      order_id: data.id,
      issued_at: data.created_at,
      event: product?.name ?? null,
      tier: product?.tier ?? null,
      venue: product?.venue ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { valid: false, reason: "error", error: message },
      { status: 500 }
    );
  }
}
