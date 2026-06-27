import type { Product } from "@/lib/types";
import { getRememberedOrderIds } from "@/lib/api";

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

export async function getMyOrders(): Promise<OrderItem[]> {
  const ids = getRememberedOrderIds();
  if (ids.length === 0) return [];
  const results = await Promise.all(
    ids.map((id) => getOrderById(id).catch(() => null))
  );
  return results.filter(
    (o): o is OrderItem => o !== null && o.status === "confirmed"
  );
}
