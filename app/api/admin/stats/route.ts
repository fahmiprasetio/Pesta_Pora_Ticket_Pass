import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Demo stats for the admin dashboard.
// Protected by ADMIN_RESET_TOKEN and executed with the service role (bypass RLS)
// so it can count all orders, not just the current user's.
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_RESET_TOKEN;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "ADMIN_RESET_TOKEN is not set in the environment. Add it first to open the dashboard.",
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
      { error: "Invalid admin token." },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseServer();

    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id,name,price,total_stock,remaining_stock")
      .order("created_at", { ascending: true })
      .limit(1);
    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }
    const product = products?.[0] ?? null;

    const [totalRes, confirmedRes, pendingRes, paidRes] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "paid"),
    ]);

    const totalStock = product?.total_stock ?? 0;
    const remainingStock = product?.remaining_stock ?? 0;
    const price = product?.price ?? 0;
    const confirmedOrders = confirmedRes.count ?? 0;
    const sold = Math.max(totalStock - remainingStock, 0);

    return NextResponse.json({
      product_name: product?.name ?? null,
      price,
      total_stock: totalStock,
      remaining_stock: remainingStock,
      sold,
      total_orders: totalRes.count ?? 0,
      confirmed_orders: confirmedOrders,
      pending_orders: pendingRes.count ?? 0,
      paid_orders: paidRes.count ?? 0,
      revenue: confirmedOrders * price,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
