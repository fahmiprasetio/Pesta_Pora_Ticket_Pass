"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import {
  fetchProduct,
  rememberProductId,
  resetBuyerToken,
} from "@/lib/api";
import {
  addToWishlist,
  isInWishlist,
  removeFromWishlist,
} from "@/lib/wishlist";
import { useAuth } from "@/components/AuthProvider";
import { formatRupiah } from "@/lib/format";
import StockBadge from "@/components/StockBadge";
import Countdown from "@/components/Countdown";
import MagneticButton from "@/components/MagneticButton";

export default function ProductCard() {
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

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

  useEffect(() => {
    if (user && product) {
      isInWishlist(product.id)
        .then(setSaved)
        .catch(() => setSaved(false));
    } else {
      setSaved(false);
    }
  }, [user, product]);

  function startPurchase() {
    if (!product) return;
    resetBuyerToken();
    rememberProductId(product.id);
    router.push("/waiting");
  }

  async function toggleWishlist() {
    if (!product) return;
    if (!user) {
      router.push("/signin");
      return;
    }
    setWishBusy(true);
    try {
      if (saved) {
        await removeFromWishlist(product.id);
        setSaved(false);
      } else {
        await addToWishlist(product.id);
        setSaved(true);
      }
    } catch {
      // abaikan, biarkan state tetap
    } finally {
      setWishBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft p-6">
        <div className="h-4 w-32 rounded bg-ink-line" />
        <div className="mt-5 h-10 w-full rounded bg-ink-line" />
        <div className="mt-6 h-24 w-full rounded bg-ink-line" />
        <div className="mt-6 h-12 w-full rounded bg-ink-line" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full rounded-2xl border border-flame/50 bg-ink-soft p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-flame">
          Koneksi backend gagal
        </p>
        <p className="mt-2 text-sm text-haze">
          {error ?? "Produk belum tersedia."} Pastikan environment Supabase
          sudah diisi dan seed.sql sudah dijalankan.
        </p>
      </div>
    );
  }

  const soldOut = product.remaining_stock <= 0;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/90 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-haze">
          {product.tier ?? "Festival Pass"}
        </span>
        <StockBadge remaining={product.remaining_stock} total={product.total_stock} />
      </div>

      <p className="mt-5 font-mono text-xs uppercase tracking-widest text-haze">
        Harga per tiket
      </p>
      <p className="font-display text-5xl leading-none text-paper">
        {formatRupiah(product.price)}
      </p>

      <div className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-haze">
          Menuju hari-H
        </p>
        <Countdown target={product.event_date} />
      </div>

      <MagneticButton
        onClick={startPurchase}
        disabled={soldOut}
        className="mt-7 w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep"
      >
        {soldOut ? "Tiket Habis" : "Beli Sekarang"}
      </MagneticButton>

      <button
        type="button"
        onClick={toggleWishlist}
        disabled={wishBusy}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-8 py-3 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
          saved
            ? "border-acid text-acid"
            : "border-ink-line text-haze hover:border-paper hover:text-paper"
        }`}
      >
        <span className={`text-base leading-none ${saved ? "text-acid" : ""}`}>
          {saved ? "\u2665" : "\u2661"}
        </span>
        {user
          ? saved
            ? "Tersimpan di Wishlist"
            : "Simpan ke Wishlist"
          : "Wishlist (login dulu)"}
      </button>

      <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-widest text-haze">
        Anti-overselling dijamin di level database
      </p>
    </div>
  );
}
