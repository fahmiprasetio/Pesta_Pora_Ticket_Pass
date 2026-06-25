"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import { EVENT } from "@/lib/event";

type VerifyResult = {
  valid: boolean;
  status?: string;
  payment_status?: string | null;
  order_id?: string;
  issued_at?: string;
  event?: string | null;
  tier?: string | null;
  venue?: string | null;
  reason?: string;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-ink-line py-3 font-mono text-xs uppercase tracking-widest">
      <span className="text-haze">{label}</span>
      <span className="text-right text-paper">{value}</span>
    </div>
  );
}

export default function VerifyPage() {
  const params = useParams<{ id: string }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetch(`/api/verify/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (active) setResult(json as VerifyResult);
      })
      .catch(() => {
        if (active) setResult({ valid: false, reason: "error" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const valid = Boolean(result?.valid);
  const pending = result?.status === "pending";
  const notFound = result?.reason === "not_found";

  const invalidTitle = pending ? "Not Paid" : notFound ? "Not Found" : "Invalid";
  const invalidMessage = pending
    ? "Payment for this ticket has not completed. Entry is denied until it is paid."
    : notFound
      ? "No ticket matches this code. It may be fake or already revoked."
      : "This ticket is not valid for entry.";

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-clip px-6 py-16">
      <Grain />
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full blur-[140px] drift ${
          valid ? "bg-acid/15" : "bg-flame/15"
        }`}
      />
      <Link
        href="/"
        className="relative z-10 mb-10 font-display text-xl uppercase tracking-tight"
      >
        Lonjak
      </Link>

      <div className="relative z-10 w-full max-w-lg">
        {loading ? (
          <div className="h-72 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
        ) : valid && result ? (
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
              Gate verification
            </p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-none text-acid md:text-7xl">
              Valid Ticket
            </h1>
            <div className="mt-8 w-full rounded-2xl border border-acid/40 bg-ink-soft p-6 text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
                {result.tier ?? EVENT.tier}
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-tight">
                {result.event ?? `${EVENT.name} ${EVENT.edition}`}
              </h2>
              <div className="mt-4">
                <Row label="Venue" value={result.venue ?? EVENT.venue} />
                <Row label="Date" value={EVENT.dateLabel} />
                <Row
                  label="Order"
                  value={(result.order_id ?? "").slice(0, 8).toUpperCase()}
                />
                {result.issued_at && (
                  <Row label="Issued" value={formatDateTime(result.issued_at)} />
                )}
                <Row label="Status" value="Confirmed" />
              </div>
            </div>
            <p className="mt-6 max-w-[42ch] text-sm text-haze">
              This ticket is confirmed and permanently recorded in the database.
              Admit one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-flame">
              Gate verification
            </p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-none text-flame md:text-7xl">
              {invalidTitle}
            </h1>
            <p className="mt-6 max-w-[42ch] text-sm text-haze">
              {invalidMessage}
            </p>
            {id && (
              <p className="mt-4 break-all font-mono text-[11px] uppercase tracking-widest text-haze">
                Code {id.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
