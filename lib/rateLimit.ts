// Lightweight, dependency-free rate limiter.
//
// Goal: stop bots/scalpers from spamming sensitive endpoints (e.g.
// /api/purchase, /api/payment/create) during a flash sale.
//
// Two modes, chosen automatically:
// 1. Distributed (recommended for production / multi-instance deploys):
//    set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. We call the
//    Upstash REST API directly with fetch, so NO extra npm package is needed
//    and the limit is shared across every serverless/edge instance.
// 2. In-memory fallback (used when those env vars are absent): a simple
//    fixed-window counter kept in process memory. This is perfectly fine for
//    local dev or a single long-running server (e.g. one Docker container),
//    but on multi-instance/serverless it only protects within one instance.
//
// Tunables (all optional, with sensible defaults):
//   RATE_LIMIT_MAX             -> max requests per window (default 10)
//   RATE_LIMIT_WINDOW_SECONDS  -> window length in seconds (default 10)

const LIMIT = Number(process.env.RATE_LIMIT_MAX ?? 10);
const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 10);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms when the current window resets
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// --- Distributed limiter via Upstash REST (fixed window with INCR + EXPIRE) ---
async function upstashRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    // INCR the counter, set the TTL only on the first hit (NX), then read the
    // remaining TTL so we can report an accurate reset time.
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, WINDOW_SECONDS, "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    // Fail OPEN: never block real buyers because of an Upstash hiccup.
    return {
      success: true,
      limit: LIMIT,
      remaining: LIMIT,
      reset: Date.now() + WINDOW_SECONDS * 1000,
    };
  }

  const data = (await res.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);
  let ttl = Number(data[2]?.result ?? WINDOW_SECONDS * 1000);
  if (!Number.isFinite(ttl) || ttl < 0) ttl = WINDOW_SECONDS * 1000;

  return {
    success: count <= LIMIT,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - count),
    reset: Date.now() + ttl,
  };
}

// --- In-memory fallback (fixed window) ---
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;
  const existing = buckets.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(identifier, { count: 1, resetAt });
    return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset: resetAt };
  }

  existing.count += 1;
  return {
    success: existing.count <= LIMIT,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - existing.count),
    reset: existing.resetAt,
  };
}

// Opportunistically drop expired in-memory buckets so the Map cannot grow
// without bound on a long-running server.
function sweep(): void {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Returns whether the caller (identified by `identifier`, usually
 * "<path>:<ip>") is allowed to proceed under the configured limit.
 */
export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await upstashRateLimit(identifier);
    } catch {
      // Upstash unreachable -> degrade gracefully to in-memory.
      return memoryRateLimit(identifier);
    }
  }
  sweep();
  return memoryRateLimit(identifier);
}
