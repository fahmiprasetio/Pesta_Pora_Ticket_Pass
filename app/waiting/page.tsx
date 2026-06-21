import Link from "next/link";
import Grain from "@/components/Grain";
import QueueStatus from "@/components/QueueStatus";
import { EVENT } from "@/lib/event";

export default function WaitingPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-clip px-6 py-16">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/10 blur-[140px] drift"
      />
      <Link
        href="/"
        className="relative z-10 mb-8 font-display text-xl uppercase tracking-tight"
      >
        Lonjak
      </Link>
      <p className="relative z-10 mb-6 text-center font-mono text-xs uppercase tracking-[0.3em] text-haze">
        {EVENT.name} {EVENT.edition}
      </p>
      <div className="relative z-10 flex justify-center">
        <QueueStatus />
      </div>
    </main>
  );
}
