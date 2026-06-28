import type { Product } from "@/lib/types";
import {
  getRememberedOrderIds,
  getCachedTickets,
  rememberTicket,
} from "@/lib/api";

export interface OrderItem {
  id: string;
  status: string;
  created_at: string;
  product: Product;
}

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  product: Product | Product[] | null;
};

function normalize(row: OrderRow): OrderItem | null {
  const product = Array.isArray(row.product) ? row.product[0] : row.product;
  if (!product) return null;
  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    product,
  };
}

export async function getOrderById(id: string): Promise<OrderItem | null> {
  if (!id) return null;
  const res = await fetch(`/api/order/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as OrderRow | { error: string };
  if (!json || !("id" in json)) return null;
  return normalize(json as OrderRow);
}

// Return every ticket bought on this device. We combine the locally cached
// tickets with the remembered order ids, refresh each from the database when
// possible, and fall back to the local cache when the database no longer has
// the row (e.g. after a demo reset). This guarantees that all purchased
// tickets keep showing up, even after a refresh.
export async function getMyOrders(): Promise<OrderItem[]> {
  const ids = getRememberedOrderIds();
  const cached = getCachedTickets();
  const cacheById = new Map(cached.map((t) => [t.id, t] as const));

  const allIds = Array.from(new Set([...ids, ...cached.map((t) => t.id)]));
  if (allIds.length === 0) return [];

  const results = await Promise.all(
    allIds.map(async (id) => {
      const fresh = await getOrderById(id).catch(() => null);
      if (fresh) {
        // Keep the local cache fresh so the ticket survives later resets.
        rememberTicket(fresh);
        return fresh;
      }
      // Database does not have it anymore (or we are offline): use the cache.
      const fallback = cacheById.get(id);
      return fallback ? (fallback as OrderItem) : null;
    })
  );

  const seen = new Set<string>();
  const orders: OrderItem[] = [];
  for (const o of results) {
    if (o && o.status === "confirmed" && !seen.has(o.id)) {
      seen.add(o.id);
      orders.push(o);
    }
  }

  // Newest first.
  orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return orders;
}
