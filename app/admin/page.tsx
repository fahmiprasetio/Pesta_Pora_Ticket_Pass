"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Grain from "@/components/Grain";
import MagneticButton from "@/components/MagneticButton";
import StockBadge from "@/components/StockBadge";
import type { Product } from "@/lib/types";
import { fetchProduct } from "@/lib/api";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const p = await fetchProduct();
      setProduct(p);
    } catch {
      setProduct(null);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleReset() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal reset");
      setMessage(json.message ?? "Stok berhasil direset.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-clip px-6 py-12">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-0 h-[28rem] w-[28rem] rounded-full bg-flame/10 blur-[130px] drift"
      />
      <div className="relative z-10 mx-auto w-full max-w-lg">
        <Link href="/" className="font-display text-xl uppercase tracking-tight">
          Lonjak
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-flame">
          Panel demo
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none md:text-6xl">
          Reset Stok
        </h1>
        <p className="mt-3 max-w-[44ch] text-sm text-haze">
          Kembalikan stok ke penuh dan bersihkan seluruh order untuk mengulang
          drop saat merekam video demo.
        </p>

        <div className="mt-8 rounded-2xl border border-ink-line bg-ink-soft p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-haze">
              Stok saat ini
            </span>
            {product ? (
              <StockBadge
                remaining={product.remaining_stock}
                total={product.total_stock}
              />
            ) : (
              <span className="font-mono text-xs text-haze">-</span>
            )}
          </div>
          {product && (
            <p className="mt-3 font-display text-4xl uppercase leading-none">
              {product.remaining_stock}
              <span className="text-haze"> / {product.total_stock}</span>
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <label className="block font-mono text-[11px] uppercase tracking-widest text-haze">
            Token admin
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_RESET_TOKEN"
            className="w-full rounded-xl border border-ink-line bg-ink px-4 py-3 font-mono text-sm text-paper outline-none focus:border-acid"
          />
          <MagneticButton
            onClick={handleReset}
            disabled={busy || token.length === 0}
            className="w-full rounded-full bg-flame px-8 py-4 font-display text-xl uppercase tracking-wide text-paper hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Mereset..." : "Reset Stok dan Order"}
          </MagneticButton>
        </div>

        {message && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-acid">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-flame">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
