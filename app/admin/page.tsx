"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Grain from "@/components/Grain";
import MagneticButton from "@/components/MagneticButton";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/format";

type Stats = {
  product_name: string | null;
  price: number;
  total_stock: number;
  remaining_stock: number;
  sold: number;
  total_orders: number;
  confirmed_orders: number;
  pending_orders: number;
  paid_orders: number;
  revenue: number;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetErr, setResetErr] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const loadStats = useCallback(async (currentToken: string) => {
    const res = await fetch("/api/admin/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: currentToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Gagal memuat statistik");
    setStats(json as Stats);
  }, []);

  async function handleConnect() {
    setStatsError(null);
    try {
      await loadStats(token);
      setConnected(true);
    } catch (e) {
      setConnected(false);
      setStatsError(e instanceof Error ? e.message : "Gagal memuat statistik");
    }
  }

  // Polling statistik order tiap 2,5 detik.
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      loadStats(token).catch(() => {});
    }, 2500);
    return () => clearInterval(id);
  }, [connected, token, loadStats]);

  // Realtime: sisa stok ikut turun seketika tanpa menunggu polling.
  useEffect(() => {
    if (!connected) return;
    let supabase;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      return;
    }
    const channel = supabase.channel("admin-stock");
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "products" },
      (payload) => {
        const next = payload.new as { remaining_stock?: number };
        if (typeof next.remaining_stock === "number") {
          const value = next.remaining_stock;
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  remaining_stock: value,
                  sold: Math.max(prev.total_stock - value, 0),
                }
              : prev
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
  }, [connected]);

  async function handleReset() {
    setBusy(true);
    setResetMsg(null);
    setResetErr(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal reset");
      setResetMsg(json.message ?? "Stok berhasil direset.");
      await loadStats(token).catch(() => {});
    } catch (e) {
      setResetErr(e instanceof Error ? e.message : "Gagal reset");
    } finally {
      setBusy(false);
    }
  }

  const soldPct =
    stats && stats.total_stock > 0
      ? Math.min(Math.round((stats.sold / stats.total_stock) * 100), 100)
      : 0;
  const barStyle = { width: `${soldPct}%` };

  const cards = stats
    ? [
        {
          label: "Sisa stok",
          value: String(stats.remaining_stock),
          sub: `dari ${stats.total_stock}`,
          tone: "text-acid",
        },
        {
          label: "Terjual",
          value: String(stats.sold),
          sub: "tiket terklaim",
          tone: "text-flame",
        },
        {
          label: "Order confirmed",
          value: String(stats.confirmed_orders),
          sub: "order sukses",
          tone: "text-paper",
        },
        {
          label: "Pending reservasi",
          value: String(stats.pending_orders),
          sub: "menunggu bayar",
          tone: "text-paper",
        },
        {
          label: "Terbayar Midtrans",
          value: String(stats.paid_orders),
          sub: "lunas (paid)",
          tone: "text-acid",
        },
        {
          label: "Estimasi pendapatan",
          value: formatRupiah(stats.revenue),
          sub: "dari order confirmed",
          tone: "text-paper",
        },
      ]
    : [];

  return (
    <main className="relative min-h-[100dvh] overflow-clip px-6 py-12">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-0 h-[28rem] w-[28rem] rounded-full bg-flame/10 blur-[130px] drift"
      />
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link href="/" className="font-display text-xl uppercase tracking-tight">
          Lonjak
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-flame">
          Panel demo
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl uppercase leading-none md:text-6xl">
            Dashboard Admin
          </h1>
          {live && (
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
              </span>
              Live
            </span>
          )}
        </div>
        <p className="mt-3 max-w-[52ch] text-sm text-haze">
          Pantau sisa stok, order, dan pembayaran secara langsung. Sisa stok
          diperbarui realtime, statistik order disegarkan tiap 2,5 detik.
        </p>

        {!connected ? (
          <div className="mt-8 rounded-2xl border border-ink-line bg-ink-soft p-6">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-haze">
              Token admin
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ADMIN_RESET_TOKEN"
              className="mt-3 w-full rounded-xl border border-ink-line bg-ink px-4 py-3 font-mono text-sm text-paper outline-none focus:border-acid"
            />
            <MagneticButton
              onClick={handleConnect}
              disabled={token.length === 0}
              className="mt-4 w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep disabled:opacity-40"
            >
              Hubungkan dan Pantau
            </MagneticButton>
            {statsError && (
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-flame">
                {statsError}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line md:grid-cols-3">
              {cards.map((c) => (
                <div key={c.label} className="bg-ink-soft p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-haze">
                    {c.label}
                  </p>
                  <p className={`mt-2 font-display text-4xl leading-none ${c.tone}`}>
                    {c.value}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-haze">
                    {c.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-ink-line bg-ink-soft p-6">
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-haze">
                <span>Progres terjual</span>
                <span className="text-paper">{soldPct}%</span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-ink-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-acid to-flame transition-all duration-500"
                  style={barStyle}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-ink-line bg-ink-soft p-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-flame">
                Reset demo
              </p>
              <p className="mt-2 max-w-[44ch] text-sm text-haze">
                Kembalikan stok ke penuh dan hapus seluruh order untuk mengulang
                drop saat merekam video.
              </p>
              <MagneticButton
                onClick={handleReset}
                disabled={busy}
                className="mt-5 w-full rounded-full bg-flame px-8 py-4 font-display text-xl uppercase tracking-wide text-paper hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Mereset..." : "Reset Stok dan Order"}
              </MagneticButton>
              {resetMsg && (
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-acid">
                  {resetMsg}
                </p>
              )}
              {resetErr && (
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-flame">
                  {resetErr}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
