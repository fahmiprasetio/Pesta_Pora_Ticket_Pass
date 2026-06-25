import Grain from "@/components/Grain";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import NavBar from "@/components/NavBar";
import { EVENT } from "@/lib/event";

const STATS = [
  { value: "100", label: "Tiket", note: "Stok tetap. Tidak pernah bertambah diam-diam." },
  { value: "1", label: "Drop", note: "Satu gerbang, satu waktu, untuk semua." },
  { value: "0", label: "Oversold", note: "Dijamin di level baris database." },
  { value: "100%", label: "Konsisten", note: "Tiket ke-101 tidak pernah ada." },
];

const FEATURES = [
  {
    num: "01",
    title: "Anti Overselling",
    body: "Stok dikurangi lewat satu UPDATE ber-row-lock di Postgres. Ribuan request konkuren diserialisasi, jadi stok tidak bisa tembus nol.",
    spec: "Postgres row lock + unique index",
  },
  {
    num: "02",
    title: "Rapid Elasticity",
    body: "Berjalan di atas fungsi serverless yang membesar otomatis saat trafik meledak, lalu mengecil lagi saat sepi. Tanpa server nganggur.",
    spec: "Vercel serverless + Supabase",
  },
  {
    num: "03",
    title: "Measured Service",
    body: "Tiap drop terukur. Request per detik, latensi p95, dan rasio sukses dipantau langsung lewat skenario load test k6.",
    spec: "k6 load test",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Antre",
    body: "Masuk ruang tunggu virtual. Tiap pembeli memegang token unik, tanpa wajib daftar akun.",
  },
  {
    num: "02",
    title: "Gerbang dibuka",
    body: "Begitu drop mulai, ribuan permintaan menghantam endpoint yang sama di detik yang sama.",
  },
  {
    num: "03",
    title: "Kunci atomik",
    body: "Postgres mengunci baris stok dan menguranginya satu per satu. Seratus tetap seratus.",
  },
  {
    num: "04",
    title: "Tiket terbit",
    body: "Slot yang berhasil langsung dikonfirmasi. E-tiket ber-QR siap dipindai dan diunduh.",
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
          <h1 className="mt-5 font-display text-[clamp(3.5rem,12vw,11rem)] uppercase leading-[0.82]">
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
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-haze">
            Seratus tiket. Satu gerbang. Ribuan tangan di detik yang sama. Lonjak
            dibangun untuk bertahan saat trafiknya meledak, dan memastikan tiket
            ke-101 tidak pernah ada.
          </p>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-paper/70">
            Tanpa daftar <span className="text-acid">/</span> Token unik per pembeli{" "}
            <span className="text-acid">/</span> Anti-calo di level database
          </p>
        </div>

        <div id="tiket" className="scroll-mt-24 lg:pl-4">
          <ProductCard />
        </div>
      </section>

      <Marquee items={EVENT.lineup} />

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
            Anatomi satu drop
          </p>
          <h2 className="mt-3 max-w-[18ch] font-display text-4xl uppercase leading-none md:text-6xl">
            Dari antrean ke tiket dalam empat langkah
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
              Gerbang menutup tanpa aba-aba
            </p>
            <h2 className="mt-4 max-w-[16ch] font-display text-5xl uppercase leading-[0.9] md:text-7xl">
              Seratus tiket. Satu detik. Siapa cepat.
            </h2>
            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-haze">
              Tidak ada babak kedua. Begitu stok habis, drop selesai. Amankan
              tempatmu sebelum yang lain.
            </p>
            <a
              href="#tiket"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink transition-colors hover:bg-acid-deep"
            >
              Ke tiket
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-ink-line">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-1 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="font-display text-base uppercase tracking-wide">Lonjak</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-haze">
            &copy; 2026 Lonjak. Seluruh hak cipta dilindungi.
          </span>
        </div>
      </footer>
    </main>
  );
}
