"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import {
  fetchProduct,
  rememberProductId,
  resetBuyerToken,
} from "@/lib/api";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/format";
import StockBadge from "@/components/StockBadge";
import Countdown from "@/components/Countdown";
import MagneticButton from "@/components/MagneticButton";

export default function ProductCard() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProduct()
      .then((p) => {
        if (active) {
          setProduct(p);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Realtime subscription: remaining stock drops automatically without refresh.
  const productId = product?.id;
  useEffect(() => {
    if (!productId) return;
    let supabase;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      return;
    }
    const channel = supabase.channel(`stock-${productId}`);
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "products",
        filter: `id=eq.${productId}`,
      },
      (payload) => {
        const next = payload.new as { remaining_stock?: number };
        if (typeof next.remaining_stock === "number") {
          const value = next.remaining_stock;
          setProduct((prev) =>
            prev ? { ...prev, remaining_stock: value } : prev
          );
        }
      }
    );
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") setLive(true);
    });
    return () => {
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [productId]);

  function startPurchase() {
    if (!product) return;
    resetBuyerToken();
    rememberProductId(product.id);
    router.push("/waiting");
  }

  if (loading) {
    return (
      <div className="w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft p-5">
        <div className="h-4 w-32 rounded bg-ink-line" />
        <div className="mt-4 h-8 w-full rounded bg-ink-line" />
        <div className="mt-5 h-20 w-full rounded bg-ink-line" />
        <div className="mt-5 h-11 w-full rounded bg-ink-line" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full rounded-2xl border border-flame/50 bg-ink-soft p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-flame">
          Backend connection failed
        </p>
        <p className="mt-2 text-sm text-haze">
          {error ?? "Product not available yet."} Make sure your Supabase
          environment variables are set and seed.sql has been run.
        </p>
      </div>
    );
  }

  const soldOut = product.remaining_stock <= 0;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/90 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-haze">
          {product.tier ?? "Festival Pass"}
        </span>
        <StockBadge remaining={product.remaining_stock} total={product.total_stock} />
      </div>

      {live && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
            Live stock
          </span>
        </div>
      )}

      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-haze">
        Price per ticket
      </p>
      <p className="font-display text-4xl leading-none text-paper">
        {formatRupiah(product.price)}
      </p>

      <div className="mt-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-haze">
          Time until showtime
        </p>
        <Countdown target={product.event_date} />
      </div>

      <MagneticButton
        onClick={startPurchase}
        disabled={soldOut}
        className="mt-6 w-full rounded-full bg-acid px-8 py-3 font-display text-lg uppercase tracking-wide text-ink hover:bg-acid-deep"
      >
        {soldOut ? "Sold Out" : "Buy Now"}
      </MagneticButton>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-haze">
        Anti-overselling guaranteed at the database level
      </p>
    </div>
  );
}
