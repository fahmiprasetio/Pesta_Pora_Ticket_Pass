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
    .map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return {
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        product,
      };
    })
    .filter((item): item is OrderItem => Boolean(item.product));
}
