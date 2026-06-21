import { getSupabaseBrowser } from "@/lib/supabaseClient";
import type { Product } from "@/lib/types";

export interface WishlistItem {
  id: string;
  created_at: string;
  product: Product;
}

type WishlistRow = {
  id: string;
  created_at: string;
  product: Product | Product[] | null;
};

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("wishlists")
    .select("id, created_at, product:products(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as WishlistRow[];
  return rows
    .map((row) => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return { id: row.id, created_at: row.created_at, product };
    })
    .filter((item): item is WishlistItem => Boolean(item.product));
}

export async function addToWishlist(productId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = await currentUserId();
  if (!userId) throw new Error("Harus login terlebih dahulu");
  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, product_id: productId });
  // 23505 = duplikat (sudah ada di wishlist), aman diabaikan.
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = await currentUserId();
  if (!userId) throw new Error("Harus login terlebih dahulu");
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  const userId = await currentUserId();
  if (!userId) return false;
  const { data, error } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
