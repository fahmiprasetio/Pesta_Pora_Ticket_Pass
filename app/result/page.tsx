"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import TicketStub from "@/components/TicketStub";
import MagneticButton from "@/components/MagneticButton";
import type { PurchaseResult } from "@/lib/types";
import { EVENT } from "@/lib/event";
import { readResult, rememberOrderId } from "@/lib/api";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const r = readResult();
    setResult(r);
    setReady(true);
    if (r?.success && r.status === "confirmed" && r.order_id) {
      // Save the ticket to this device so it appears under My Tickets.
      rememberOrderId(r.order_id);
    }
  }, []);

  if (!ready) {
    return <main className="min-h-[100dvh] bg-ink" />;
  }

  const success = Boolean(result?.success) && result?.status === "confirmed";
  const soldOut = result?.status === "sold_out";
  const orderId = result?.order_id ?? "";
  const canViewTicket = success && orderId.length > 0;

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-clip px-6 py-16">
      <Grain />
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full blur-[140px] drift ${
          success ? "bg-acid/15" : "bg-flame/15"
        }`}
      />
      <Link
        href="/"
        className="relative z-10 mb-10 font-display text-xl uppercase tracking-tight"
      >
        Lonjak
      </Link>

      <div className="relative z-10 w-full">
        {success && result ? (
          <div className="flex flex-col items-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
              Ticket secured
            </p>
            <h1 className="mb-8 mt-3 text-center font-display text-6xl uppercase leading-none text-acid md:text-7xl">
              Success
            </h1>
            <TicketStub
              subtitle={
                result.already_purchased
                  ? "Ticket already active"
                  : "E-Ticket / Festival Pass"
              }
              title={`${EVENT.name} ${EVENT.edition}`}
              code={`ID ${orderId.slice(0, 8).toUpperCase()}`}
              lines={[
                { label: "Date", value: EVENT.dateLabel },
                { label: "Venue", value: EVENT.venue },
                { label: "Tier", value: EVENT.tier },
                { label: "Stock left", value: String(result.remaining_stock) },
              ]}
            />
            <p className="mt-6 max-w-[40ch] text-center text-sm text-haze">
              {result.already_purchased
                ? "This token already holds a ticket. The system automatically rejects duplicate purchases."
                : "Stock was decremented atomically in the database. Your order id is unique and permanently recorded."}
            </p>
            {canViewTicket && (
              <Link
                href={`/ticket/${orderId}`}
                className="mt-6 inline-block rounded-full bg-acid px-7 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-acid-deep"
              >
                View E-Ticket
              </Link>
            )}
            <p className="mt-4 max-w-[44ch] text-center font-mono text-[11px] uppercase tracking-widest text-haze">
              Saved to this device. Find it anytime under My Tickets.
            </p>
          </div>
        ) : soldOut ? (
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-flame">
              You were a step too slow
            </p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-none text-flame md:text-8xl">
              Sold Out
            </h1>
            <p className="mt-6 max-w-[42ch] text-sm text-haze">
              All tickets are gone. Even with thousands of requests arriving at
              once, the system never sells beyond available stock.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <h1 className="font-display text-5xl uppercase leading-none md:text-6xl">
              No transaction yet
            </h1>
            <p className="mt-6 max-w-[40ch] text-sm text-haze">
              Start from the home page to join the ticket drop.
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <MagneticButton
            onClick={() => router.push("/")}
            className="rounded-full border border-ink-line bg-ink-soft px-8 py-4 font-display text-lg uppercase tracking-wide text-paper hover:border-acid hover:text-acid"
          >
            Back to Home
          </MagneticButton>
        </div>
      </div>
    </main>
  );
}
