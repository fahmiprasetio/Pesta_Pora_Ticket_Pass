import Grain from "@/components/Grain";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import NavBar from "@/components/NavBar";
import { EVENT } from "@/lib/event";

const STATS = [
  { value: "100", label: "Tickets", note: "Fixed stock. Never quietly topped up." },
  { value: "1", label: "Drop", note: "One gate, one moment, for everyone." },
  { value: "0", label: "Oversold", note: "Guaranteed at the database row level." },
  { value: "100%", label: "Consistent", note: "There is no ticket number 101." },
];

const FEATURES = [
  {
    num: "01",
    title: "Anti Overselling",
    body: "Stock is decremented in a single row-locked UPDATE in Postgres. Thousands of concurrent requests are serialized, so stock can never drop below zero.",
    spec: "Postgres row lock + unique index",
  },
  {
    num: "02",
    title: "Rapid Elasticity",
    body: "Runs on serverless functions that scale up automatically when traffic spikes, then shrink back when it is quiet. No idle servers.",
    spec: "Vercel serverless + Supabase",
  },
  {
    num: "03",
    title: "Measured Service",
    body: "Every drop is measured. Requests per second, p95 latency, and success rate are tracked live through k6 load test scenarios.",
    spec: "k6 load test",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Queue",
    body: "Enter the virtual waiting room. Every buyer holds a unique token, with no account required.",
  },
  {
    num: "02",
    title: "Gates open",
    body: "The moment the drop starts, thousands of requests hit the same endpoint in the same second.",
  },
  {
    num: "03",
    title: "Atomic lock",
    body: "Postgres locks the stock row and decrements it one by one. A hundred stays a hundred.",
  },
  {
    num: "04",
    title: "Ticket issued",
    body: "Successful slots are confirmed instantly. A QR e-ticket is ready to scan and download.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-[100dvh] overflow-clip">
      <Grain />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[-10%] h-[40rem] w-[40rem] rounded-full bg-acid/10 blur-[120px] drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-20%] top-[18%] h-[36rem] w-[36rem] rounded-full bg-flame/10 blur-[140px] drift"
      />

      <div className="flex min-h-[100dvh] flex-col">
        <NavBar />

        <section className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-6 pb-10 pt-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-acid/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
                  </span>
                  Drop live
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.4em] text-haze">
                  {EVENT.tier}
                </span>
              </div>
              <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,5rem)] uppercase leading-[0.85]">
                {EVENT.name}
                <span className="block text-stroke-acid">{EVENT.edition}</span>
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-widest text-haze">
                <span>{EVENT.dateLabel}</span>
                <span className="h-1 w-1 rounded-full bg-acid" />
                <span>{EVENT.venue}</span>
                <span className="h-1 w-1 rounded-full bg-acid" />
                <span>{EVENT.gates}</span>
              </div>
              <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-haze">
                A hundred tickets, one gate, thousands of buyers in the same
                second. Built to survive the surge without ever overselling.
              </p>
            </div>

            <div id="tiket" className="w-full scroll-mt-24 lg:max-w-md lg:justify-self-end lg:pl-4">
              <ProductCard />
            </div>
          </div>
        </section>

        <Marquee items={EVENT.lineup} />
      </div>

      <section className="relative z-10 border-y border-ink-line bg-ink">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-ink-line md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-ink px-6 py-10">
              <p className="font-display text-6xl leading-none text-acid md:text-7xl">
                {s.value}
              </p>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-paper">
                {s.label}
              </p>
              <p className="mt-2 max-w-[24ch] text-sm leading-relaxed text-haze">
                {s.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-20">
        <Reveal>
          <h2 className="max-w-[20ch] font-display text-4xl uppercase leading-none md:text-6xl">
            What we sell is not tickets, but <span className="text-acid">resilience</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 90} className="bg-ink-soft">
              <div className="flex h-full flex-col p-8">
                <span className="font-display text-5xl text-acid">{f.num}</span>
                <h3 className="mt-5 font-display text-2xl uppercase leading-tight">
                  {f.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-haze">{f.body}</p>
                <p className="mt-6 border-t border-ink-line pt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/60">
                  {f.spec}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-8">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-flame">
            Anatomy of one drop
          </p>
          <h2 className="mt-3 max-w-[18ch] font-display text-4xl uppercase leading-none md:text-6xl">
            From queue to ticket in four steps
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 80} className="bg-ink-soft">
              <div className="flex h-full flex-col p-7">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-flame">
                  {s.num}
                </span>
                <h3 className="mt-4 font-display text-2xl uppercase leading-tight">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-haze">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-ink-line bg-ink-soft px-8 py-16 md:px-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-flame/15 blur-[120px] drift"
          />
          <div className="relative z-10">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
              The gate closes without warning
            </p>
            <h2 className="mt-4 max-w-[16ch] font-display text-5xl uppercase leading-[0.9] md:text-7xl">
              A hundred tickets. One second. First come, first served.
            </h2>
            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-haze">
              There is no second round. The moment stock runs out, the drop is
              over. Lock in your spot before everyone else.
            </p>
            <a
              href="#tiket"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink transition-colors hover:bg-acid-deep"
            >
              Go to tickets
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink-line">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-1 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="font-display text-base uppercase tracking-wide">Lonjak</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-haze">
            &copy; 2026 Lonjak. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}
