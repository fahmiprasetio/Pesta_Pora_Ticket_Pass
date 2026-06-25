"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Grain from "@/components/Grain";
import NavBar from "@/components/NavBar";
import { getMyOrders, type OrderItem } from "@/lib/orders";
import { formatRupiah } from "@/lib/format";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyTicketsPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyOrders()
      .then((items) => {
        if (active) setOrders(items);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="relative min-h-[100dvh] overflow-clip">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-15%] top-0 h-[34rem] w-[34rem] rounded-full bg-acid/10 blur-[140px] drift"
      />

      <NavBar />

      <section className="relative z-10 mx-auto max-w-[900px] px-6 pb-16 pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
          On this device
        </p>
        <h1 className="mt-2 font-display text-6xl uppercase leading-none md:text-7xl">
          My Tickets
        </h1>
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-haze">
          No account needed. Your tickets are saved on this device and stored
          permanently in the database by their unique id. Open one to show the
          QR at the gate.
        </p>

        {loading ? (
          <div className="mt-10 h-28 w-full animate-pulse rounded-2xl border border-ink-line bg-ink-soft" />
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-ink-line bg-ink-soft/50 p-10 text-center">
            <p className="font-display text-2xl uppercase text-haze">
              No tickets on this device
            </p>
            <p className="mx-auto mt-3 max-w-[40ch] text-sm text-haze">
              Tickets you secure during the drop appear here automatically. If
              you bought on another device, open the e-ticket link from there.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-acid px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-acid-deep"
            >
              Go to the drop
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/ticket/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-acid/30 bg-ink-soft p-5 transition-colors hover:border-acid"
              >
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
                    {order.product.tier ?? "Festival Pass"}
                  </p>
                  <p className="mt-1 font-display text-2xl uppercase leading-tight">
                    {order.product.name}
                  </p>
                  <p className="mt-1 font-mono text-xs uppercase tracking-widest text-haze">
                    {formatDate(order.created_at)} / {formatRupiah(order.product.price)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-haze">
                    Order
                  </p>
                  <p className="font-display text-lg uppercase text-acid">
                    {order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <span className="mt-2 inline-block rounded-full border border-acid px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-acid">
                    View ticket
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
