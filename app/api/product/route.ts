import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "Produk belum tersedia. Jalankan seed.sql terlebih dahulu." },
        { status: 404 }
      );
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kesalahan tak terduga";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
