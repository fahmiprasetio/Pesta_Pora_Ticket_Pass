import type { CreatePaymentResult, Product, PurchaseResult } from "@/lib/types";

const TOKEN_KEY = "lonjak_buyer_token";
const RESULT_KEY = "lonjak_result";
const PRODUCT_KEY = "lonjak_product_id";

export function getBuyerToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = window.crypto.randomUUID();
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function resetBuyerToken(): string {
  if (typeof window === "undefined") return "";
  const token = window.crypto.randomUUID();
  window.sessionStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function rememberProductId(id: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PRODUCT_KEY, id);
  }
}

export function getRememberedProductId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PRODUCT_KEY);
}

export function storeResult(result: PurchaseResult): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  }
}

export function readResult(): PurchaseResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PurchaseResult;
  } catch {
    return null;
  }
}

export async function fetchProduct(): Promise<Product> {
  const res = await fetch("/api/product", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load product");
  return json.product as Product;
}

// Simulation path (used by simulation mode and load test): confirmed immediately.
export async function purchaseTicket(
  productId: string,
  buyerToken: string,
  accessToken?: string
): Promise<PurchaseResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch("/api/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify({ productId, buyerToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to process purchase");
  return json as PurchaseResult;
}

// Midtrans path: lock the stock slot on the server then obtain a Snap token.
export async function createPayment(
  productId: string,
  buyerToken: string,
  accessToken?: string
): Promise<CreatePaymentResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch("/api/payment/create", {
    method: "POST",
    headers,
    body: JSON.stringify({ productId, buyerToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to create transaction");
  return json as CreatePaymentResult;
}
