export interface Product {
  id: string;
  name: string;
  artist: string | null;
  venue: string | null;
  event_date: string | null;
  tier: string | null;
  price: number;
  total_stock: number;
  remaining_stock: number;
  image_url: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_token: string;
  status: string;
  created_at: string;
}

export type PurchaseStatus = "confirmed" | "sold_out";

export interface PurchaseResult {
  success: boolean;
  status: PurchaseStatus;
  order_id: string | null;
  remaining_stock: number;
  already_purchased?: boolean;
  message: string;
  buyer_token?: string;
}
