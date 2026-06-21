import Grain from "@/components/Grain";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import NavBar from "@/components/NavBar";
import { EVENT } from "@/lib/event";

const FEATURES = [
  {
    num: "01",
    title: "Anti Overselling",
    body: "Pengurangan stok terjadi atomik di Postgres dengan row lock. Seratus tiket tetap seratus walau ribuan permintaan datang bersamaan.",
  },
  {
    num: "02",
    title: "Rapid Elasticity",
    body: "Berjalan di atas platform yang menskala otomatis saat trafik melonjak, lalu mengecil lagi saat sepi. Dibuktikan lewat load test k6.",
  },
  {
    num: "03",
    title: "Measured Service",
    body: "Setiap permintaan terukur: request per detik, waktu respons, dan tingkat keberhasilan terpantau saat lonjakan terjadi.",
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

      <NavBar />

      <section className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-16 lg:pt-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
            {EVENT.tier}
          </p>
          <h1 className="mt-4 font-display text-[clamp(3.5rem,12vw,11rem)] uppercase leading-[0.82]">
            {EVENT.name}
            <span className="block text-stroke-acid">{EVENT.edition}</span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm uppercase tracking-widest text-haze">
            <span>{EVENT.dateLabel}</span>
            <span className="h-1 w-1 rounded-full bg-acid" />
            <span>{EVENT.venue}</span>
            <span className="h-1 w-1 rounded-full bg-acid" />
            <span>{EVENT.gates}</span>
          </div>
          <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-haze">
            Satu drop, seratus tiket, ribuan tangan berebut di detik yang sama.
            Lonjak dibangun untuk bertahan saat trafik meledak dan memastikan
            stok tidak pernah terjual melebihi yang ada.
          </p>
        </div>

        <div className="lg:pl-4">
          <ProductCard />
        </div>
      </section>

      <Marquee items={EVENT.lineup} />

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-20">
        <Reveal>
          <h2 className="max-w-[20ch] font-display text-4xl uppercase leading-none md:text-6xl">
            Yang dijual bukan tiket, tapi <span className="text-acid">ketahanan</span>
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
                <p className="mt-3 text-sm leading-relaxed text-haze">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <span className="font-display text-xl uppercase">Lonjak</span>
          <span className="font-mono text-xs uppercase tracking-widest text-haze">
            Next.js + Supabase / Demo Cloud Computing
          </span>
        </div>
      </footer>
    </main>
  );
}
