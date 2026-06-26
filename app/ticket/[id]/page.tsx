"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import TicketStub from "@/components/TicketStub";
import MagneticButton from "@/components/MagneticButton";
import { getOrderById, type OrderItem } from "@/lib/orders";
import { rememberOrderId } from "@/lib/api";
import { EVENT } from "@/lib/event";
import { formatRupiah } from "@/lib/format";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketPage() {
  const params = useParams<{ id: string }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const router = useRouter();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getOrderById(id)
      .then((o) => {
        if (!active) return;
        if (!o) {
          setMissing(true);
        } else {
          setOrder(o);
          // Remember this ticket on the device so it shows up in My Tickets.
          rememberOrderId(o.id);
        }
      })
      .catch(() => {
        if (active) setMissing(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (order && typeof window !== "undefined") {
      setVerifyUrl(`${window.location.origin}/verify/${order.id}`);
    }
  }, [order]);

  function handleDownload() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <main className="relative min-h-[100dvh] overflow-clip">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-acid/12 blur-[140px] drift"
      />

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-12 pt-28">
        <Link
          href="/tickets"
          className="no-print font-mono text-xs uppercase tracking-[0.3em] text-haze transition-colors hover:text-acid"
        >
          Back to my tickets
        </Link>

        {loading ? (
          <div className="mt-8 h-72 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
        ) : order ? (
          <>
            <div id="ticket-print" className="mt-8">
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
                E-Ticket
              </p>
              <h1 className="mb-8 mt-2 font-display text-5xl uppercase leading-none md:text-6xl">
                Your Ticket
              </h1>

              <TicketStub
                subtitle={order.product.tier ?? EVENT.tier}
                title={order.product.name}
                code={`ID ${order.id.slice(0, 8).toUpperCase()}`}
                qrValue={verifyUrl || order.id}
                lines={[
                  { label: "Ticket", value: "Bearer / 1 Admission" },
                  { label: "Date", value: EVENT.dateLabel },
                  { label: "Venue", value: order.product.venue ?? EVENT.venue },
                  { label: "Price", value: formatRupiah(order.product.price) },
                ]}
              />
            </div>

            <div className="no-print mt-6 grid grid-cols-2 gap-3 font-mono text-xs uppercase tracking-widest text-haze">
              <div className="rounded-xl border border-ink-line bg-ink-soft p-4">
                <p className="text-[10px] text-haze">Status</p>
                <p className="mt-1 font-display text-lg uppercase text-acid">
                  Confirmed
                </p>
              </div>
              <div className="rounded-xl border border-ink-line bg-ink-soft p-4">
                <p className="text-[10px] text-haze">Issued</p>
                <p className="mt-1 font-display text-lg uppercase text-paper">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
            </div>

            <div className="no-print mt-6 rounded-2xl border border-ink-line bg-ink-soft p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
                Scan to verify
              </p>
              <p className="mt-2 max-w-[52ch] text-sm text-haze">
                Staff scan the QR at the gate. It opens a public verification
                page that confirms the ticket is valid, and the order id is
                permanently recorded in the database as proof of purchase. This
                ticket is a bearer pass: keep the link private.
              </p>
              {verifyUrl && (
                <p className="mt-2 break-all font-mono text-[11px] text-haze">
                  {verifyUrl}
                </p>
              )}
            </div>

            <div className="no-print mt-6 flex flex-wrap gap-3">
              <MagneticButton
                onClick={handleDownload}
                className="rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep"
              >
                Download / Print E-Ticket
              </MagneticButton>
              <Link
                href="/tickets"
                className="inline-flex items-center rounded-full border border-ink-line px-8 py-4 font-mono text-xs uppercase tracking-widest text-haze transition-colors hover:border-acid hover:text-acid"
              >
                My tickets
              </Link>
            </div>
            <p className="no-print mt-3 font-mono text-[11px] uppercase tracking-widest text-haze">
              Tip: in the print dialog choose &quot;Save as PDF&quot;.
            </p>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-flame/40 bg-ink-soft p-8 text-center">
            <h1 className="font-display text-3xl uppercase text-flame">
              Ticket not found
            </h1>
            <p className="mx-auto mt-3 max-w-[40ch] text-sm text-haze">
              {missing
                ? "This ticket does not exist. Check the link and try again."
                : "This ticket could not be loaded right now."}
            </p>
            <div className="mt-6 flex justify-center">
              <MagneticButton
                onClick={() => router.push("/")}
                className="rounded-full border border-ink-line bg-ink px-8 py-3 font-mono text-xs uppercase tracking-widest text-paper hover:border-acid hover:text-acid"
              >
                Back to home
              </MagneticButton>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
