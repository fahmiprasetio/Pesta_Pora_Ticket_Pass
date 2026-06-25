import { getSupabaseBrowser } from "@/lib/supabaseClient";
import type { Product } from "@/lib/types";

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

// Riwayat tiket milik user yang sedang login (RLS membatasi ke baris sendiri).
export async function getMyOrders(): Promise<OrderItem[]> {
  const supabase = getSupabaseBrowser();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, product:products(*)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as OrderRow[];
  return rows
    .map(normalize)
    .filter((item): item is OrderItem => item !== null);
}

// Satu tiket berdasarkan id order. RLS memastikan hanya pemilik yang bisa baca.
export async function getOrderById(id: string): Promise<OrderItem | null> {
  const supabase = getSupabaseBrowser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.id) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, product:products(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  return normalize(data as unknown as OrderRow);
}
