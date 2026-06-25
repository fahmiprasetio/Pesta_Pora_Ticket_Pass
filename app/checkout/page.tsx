"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Grain from "@/components/Grain";
import MagneticButton from "@/components/MagneticButton";
import StockBadge from "@/components/StockBadge";
import type { Product } from "@/lib/types";
import { EVENT } from "@/lib/event";
import {
  createPayment,
  fetchProduct,
  getBuyerToken,
  getRememberedProductId,
  purchaseTicket,
  rememberProductId,
  storeResult,
} from "@/lib/api";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/format";

type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? "simulasi";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
const SNAP_SRC = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";
const USE_MIDTRANS = PAYMENT_MODE === "midtrans" && MIDTRANS_CLIENT_KEY !== "";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between font-mono text-sm uppercase tracking-wide text-haze">
      <span>{label}</span>
      <span className="text-paper">{value}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProduct()
      .then((p) => {
        if (active) {
          setProduct(p);
          rememberProductId(p.id);
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

  async function getAccessToken(): Promise<string | undefined> {
    try {
      const { data } = await getSupabaseBrowser().auth.getSession();
      return data.session?.access_token ?? undefined;
    } catch {
      return undefined;
    }
  }

  async function paySimulation() {
    if (!product) return;
    const productId = getRememberedProductId() ?? product.id;
    const token = getBuyerToken();
    const accessToken = await getAccessToken();
    const result = await purchaseTicket(productId, token, accessToken);
    storeResult(result);
    router.push("/result");
  }

  async function payMidtrans() {
    if (!product) return;
    const productId = getRememberedProductId() ?? product.id;
    const token = getBuyerToken();
    const accessToken = await getAccessToken();
    const res = await createPayment(productId, token, accessToken);

    if (res.status === "sold_out") {
      storeResult({
        success: false,
        status: "sold_out",
        order_id: null,
        remaining_stock: res.remaining_stock,
        message: res.message,
      });
      router.push("/result");
      return;
    }

    if (res.status === "confirmed") {
      storeResult({
        success: true,
        status: "confirmed",
        order_id: res.order_id,
        remaining_stock: res.remaining_stock,
        message: res.message,
      });
      router.push("/result");
      return;
    }

    if (!res.snap_token || !window.snap) {
      setError("Pembayaran belum siap. Coba lagi sebentar.");
      setProcessing(false);
      return;
    }

    window.snap.pay(res.snap_token, {
      onSuccess: () => {
        storeResult({
          success: true,
          status: "confirmed",
          order_id: res.order_id,
          remaining_stock: res.remaining_stock,
          message: "Pembayaran berhasil. Tiket dikonfirmasi.",
        });
        router.push("/result");
      },
      onPending: () => {
        setError("Pembayaran tertunda. Status tiket diperbarui otomatis setelah lunas.");
        setProcessing(false);
      },
      onError: () => {
        setError("Pembayaran gagal. Slot dilepas, silakan coba lagi.");
        setProcessing(false);
      },
      onClose: () => {
        setProcessing(false);
      },
    });
  }

  async function confirm() {
    if (!product) return;
    setProcessing(true);
    setError(null);
    try {
      if (USE_MIDTRANS) {
        await payMidtrans();
      } else {
        await paySimulation();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses");
      setProcessing(false);
    }
  }

  const buttonLabel = (() => {
    if (!product) return "Memuat...";
    if (product.remaining_stock <= 0) return "Tiket Habis";
    if (processing) return "Memproses...";
    return USE_MIDTRANS
      ? "Bayar dengan Midtrans"
      : "Konfirmasi Pembayaran (Simulasi)";
  })();

  return (
    <main className="relative min-h-[100dvh] overflow-clip px-6 py-10">
      {USE_MIDTRANS && (
        <Script
          src={SNAP_SRC}
          data-client-key={MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
          onLoad={() => setSnapReady(true)}
        />
      )}
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-0 h-[30rem] w-[30rem] rounded-full bg-acid/10 blur-[130px] drift"
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <Link href="/" className="font-display text-xl uppercase tracking-tight">
          Lonjak
        </Link>
        <h1 className="mt-8 font-display text-5xl uppercase leading-none md:text-6xl">
          Checkout
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-haze">
          {USE_MIDTRANS
            ? "Pembayaran via Midtrans (mode sandbox)"
            : "Langkah terakhir mengamankan tiket"}
        </p>

        {loading ? (
          <div className="mt-8 h-64 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
        ) : product ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-ink-line bg-ink-soft">
            <div className="border-b border-ink-line p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
                    {product.tier ?? EVENT.tier}
                  </p>
                  <h2 className="mt-2 font-display text-3xl uppercase leading-none">
                    {EVENT.name} {EVENT.edition}
                  </h2>
                  <p className="mt-2 font-mono text-xs uppercase tracking-widest text-haze">
                    {EVENT.dateLabel} / {EVENT.venue}
                  </p>
                </div>
                <StockBadge
                  remaining={product.remaining_stock}
                  total={product.total_stock}
                />
              </div>
            </div>

            <div className="space-y-3 p-6">
              <Row label="Tiket" value="1 x Festival Pass" />
              <Row label="Harga" value={formatRupiah(product.price)} />
              <Row label="Biaya layanan" value="Gratis" />
              <div className="my-4 border-t border-dashed border-ink-line" />
              <div className="flex items-center justify-between">
                <span className="font-display text-xl uppercase">Total</span>
                <span className="font-display text-3xl text-acid">
                  {formatRupiah(product.price)}
                </span>
              </div>
            </div>

            <div className="border-t border-ink-line bg-ink p-6">
              <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-widest text-haze">
                {USE_MIDTRANS
                  ? "Slot stok dikunci dulu, lalu pembayaran diproses lewat Midtrans Snap."
                  : "Pembayaran disimulasikan. Klik konfirmasi untuk memesan slot stok."}
              </p>
              <MagneticButton
                onClick={confirm}
                disabled={
                  processing ||
                  product.remaining_stock <= 0 ||
                  (USE_MIDTRANS && !snapReady)
                }
                className="w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep disabled:opacity-50"
              >
                {buttonLabel}
              </MagneticButton>
              {error && (
                <p className="mt-3 text-center font-mono text-xs uppercase tracking-widest text-flame">
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-flame/50 bg-ink-soft p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-flame">
              Gagal memuat
            </p>
            <p className="mt-2 text-sm text-haze">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
