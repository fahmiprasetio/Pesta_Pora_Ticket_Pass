import Barcode from "@/components/Barcode";
import QrCode from "@/components/QrCode";

type Line = { label: string; value: string };

export default function TicketStub({
  title,
  subtitle,
  lines,
  code,
  tone = "acid",
  qrValue,
}: {
  title: string;
  subtitle: string;
  lines: Line[];
  code: string;
  tone?: "acid" | "flame";
  qrValue?: string;
}) {
  const accent = tone === "flame" ? "text-flame" : "text-acid-deep";
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-paper text-ink shadow-2xl md:flex-row">
      <div className="flex-1 p-6">
        <p className={`font-mono text-xs uppercase tracking-[0.3em] ${accent}`}>
          {subtitle}
        </p>
        <h3 className="mt-2 font-display text-3xl uppercase leading-none md:text-4xl">
          {title}
        </h3>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {lines.map((l) => (
            <div key={l.label}>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50">
                {l.label}
              </dt>
              <dd className="font-display text-lg uppercase leading-tight">
                {l.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="relative flex w-full flex-col items-center justify-center gap-3 border-t-2 border-dashed border-ink/30 bg-paper p-6 md:w-52 md:border-l-2 md:border-t-0">
        {qrValue ? <QrCode value={qrValue} size={132} /> : null}
        <Barcode />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
          {code}
        </span>
      </div>
    </div>
  );
}
