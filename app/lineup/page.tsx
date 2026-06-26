import Grain from "@/components/Grain";
import NavBar from "@/components/NavBar";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import { EVENT } from "@/lib/event";

type Act = {
  name: string;
  genre: string;
  origin: string;
};

const HEADLINERS: Act[] = [
  { name: "SENJA KOLEKTIF", genre: "Indie Orchestra", origin: "Bandung" },
  { name: "RERUNTUH", genre: "Post Rock", origin: "Yogyakarta" },
  { name: "PARADE HUJAN", genre: "Dream Pop", origin: "Jakarta" },
];

const PRIME: Act[] = [
  { name: "GARIS PANTAI", genre: "Synthwave", origin: "Surabaya" },
  { name: "NOKTURNAL", genre: "Alternative", origin: "Malang" },
  { name: "MALAM MINGGU", genre: "Funk Soul", origin: "Jakarta" },
];

const SUPPORT: Act[] = [
  { name: "ARUS BALIK", genre: "Shoegaze", origin: "Semarang" },
  { name: "DERAI", genre: "Folk", origin: "Bali" },
  { name: "KMRN", genre: "Lo-fi Beat", origin: "Depok" },
  { name: "FANA", genre: "Electronic", origin: "Medan" },
];

const SCHEDULE = [
  {
    stage: "Gelora Stage",
    slots: [
      { time: "17:30", act: "FANA" },
      { time: "18:20", act: "KMRN" },
      { time: "19:15", act: "GARIS PANTAI" },
      { time: "20:20", act: "PARADE HUJAN" },
      { time: "21:40", act: "SENJA KOLEKTIF" },
    ],
  },
  {
    stage: "Nusantara Stage",
    slots: [
      { time: "17:45", act: "DERAI" },
      { time: "18:35", act: "ARUS BALIK" },
      { time: "19:30", act: "MALAM MINGGU" },
      { time: "20:35", act: "NOKTURNAL" },
      { time: "21:50", act: "RERUNTUH" },
    ],
  },
];

export default function LineupPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-clip">
      <Grain />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[-10%] h-[40rem] w-[40rem] rounded-full bg-acid/10 blur-[120px] drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-20%] top-[24%] h-[36rem] w-[36rem] rounded-full bg-flame/10 blur-[140px] drift"
      />

      <NavBar />

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-10 pt-24 lg:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-acid">
          The acts
        </p>
        <h1 className="mt-4 font-display text-[clamp(3.5rem,13vw,12rem)] uppercase leading-[0.8]">
          Line Up
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm uppercase tracking-widest text-haze">
          <span>
            {EVENT.name} {EVENT.edition}
          </span>
          <span className="h-1 w-1 rounded-full bg-acid" />
          <span>{EVENT.dateLabel}</span>
          <span className="h-1 w-1 rounded-full bg-acid" />
          <span>{EVENT.venue}</span>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-16">
        <div className="mb-6 flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-flame">
            Headliner
          </span>
          <span className="h-px flex-1 bg-ink-line" />
        </div>
        <div className="flex flex-col">
          {HEADLINERS.map((act, i) => (
            <Reveal key={act.name} delay={i * 90}>
              <div className="group flex flex-col gap-2 border-b border-ink-line py-6 md:flex-row md:items-baseline md:justify-between">
                <h2 className="font-display text-[clamp(2.5rem,8vw,6rem)] uppercase leading-[0.85] transition-colors group-hover:text-acid">
                  {act.name}
                </h2>
                <div className="font-mono text-xs uppercase tracking-widest text-haze md:text-right">
                  <p className="text-acid">{act.genre}</p>
                  <p className="mt-1">{act.origin}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Marquee items={EVENT.lineup} reverse />

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 py-16">
        <div className="mb-6 flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
            Main acts
          </span>
          <span className="h-px flex-1 bg-ink-line" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
          {PRIME.map((act, i) => (
            <Reveal key={act.name} delay={i * 80} className="bg-ink-soft">
              <div className="flex h-full flex-col justify-between p-7">
                <h3 className="font-display text-3xl uppercase leading-tight md:text-4xl">
                  {act.name}
                </h3>
                <div className="mt-8 font-mono text-xs uppercase tracking-widest text-haze">
                  <p className="text-acid">{act.genre}</p>
                  <p className="mt-1">{act.origin}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mb-6 mt-14 flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-haze">
            Support
          </span>
          <span className="h-px flex-1 bg-ink-line" />
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line lg:grid-cols-4">
          {SUPPORT.map((act, i) => (
            <Reveal key={act.name} delay={i * 70} className="bg-ink-soft">
              <div className="flex h-full flex-col justify-between p-6">
                <h4 className="font-display text-xl uppercase leading-tight md:text-2xl">
                  {act.name}
                </h4>
                <div className="mt-6 font-mono text-[0.65rem] uppercase tracking-widest text-haze">
                  <p className="text-acid">{act.genre}</p>
                  <p className="mt-1">{act.origin}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-24">
        <Reveal>
          <h2 className="max-w-[18ch] font-display text-4xl uppercase leading-none md:text-6xl">
            Stage <span className="text-acid">Schedule</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {SCHEDULE.map((stage, s) => (
            <Reveal key={stage.stage} delay={s * 120}>
              <div className="rounded-2xl border border-ink-line bg-ink-soft p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl uppercase">{stage.stage}</h3>
                  <span className="h-2 w-2 rotate-45 bg-acid" />
                </div>
                <ul className="mt-6 flex flex-col">
                  {stage.slots.map((slot) => (
                    <li
                      key={slot.time}
                      className="flex items-baseline justify-between border-t border-ink-line py-4 font-mono"
                    >
                      <span className="text-sm tracking-widest text-acid">
                        {slot.time}
                      </span>
                      <span className="font-display text-lg uppercase tracking-wide text-paper md:text-xl">
                        {slot.act}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 max-w-[60ch] font-mono text-xs uppercase leading-relaxed tracking-widest text-haze">
          Lineup and set times are subject to change.
        </p>
      </section>

      <footer className="relative z-10 border-t border-ink-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <span className="font-display text-xl uppercase">Lonjak</span>
          <span className="font-mono text-xs uppercase tracking-widest text-haze">
            © 2026 Lonjak. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}
