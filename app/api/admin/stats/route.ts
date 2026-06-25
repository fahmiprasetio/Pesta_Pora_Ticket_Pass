import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Statistik demo untuk dashboard admin.
// Dilindungi ADMIN_RESET_TOKEN dan dieksekusi pakai service role (bypass RLS)
// supaya bisa menghitung seluruh order, bukan hanya milik user.
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_RESET_TOKEN;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "ADMIN_RESET_TOKEN belum diset di environment. Tambahkan dulu untuk membuka dashboard.",
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
    const message = err instanceof Error ? err.message : "Kesalahan tak terduga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
