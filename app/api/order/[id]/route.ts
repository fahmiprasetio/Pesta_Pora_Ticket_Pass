import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Fetch a single order by its unique id. The order id is an unguessable UUID
// that acts as a bearer reference to the ticket, so no login is required.
// We never select buyer_token or user_id, so no buyer identity is exposed.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, created_at, product:products(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
