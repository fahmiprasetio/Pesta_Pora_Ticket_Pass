import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Demo reset: restore stock to full and delete orders.
// Protected by an admin token (ADMIN_RESET_TOKEN) so it cannot be triggered by
// just anyone. Executed with the service role via the reset_demo() RPC.
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_RESET_TOKEN;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "ADMIN_RESET_TOKEN is not set in the environment. Add it first to enable reset.",
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
    const { data, error } = await supabase.rpc("reset_demo");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
