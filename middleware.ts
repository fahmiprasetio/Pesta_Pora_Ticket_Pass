import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// Only run the limiter on the sensitive, write-heavy endpoints. Static assets,
// pages, and read-only routes are left untouched so normal browsing is never
// throttled.
export const config = {
  matcher: ["/api/purchase", "/api/payment/create"],
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "anonymous";
  return request.headers.get("x-real-ip") || "anonymous";
}

export async function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const identifier = `${request.nextUrl.pathname}:${ip}`;

  const result = await rateLimit(identifier);

  const headers = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };

  if (!result.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );
    return NextResponse.json(
      {
        error:
          "Terlalu banyak permintaan. Mohon tunggu beberapa saat sebelum mencoba lagi.",
      },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(retryAfter) },
      }
    );
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
