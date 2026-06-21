export default function StockBadge({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const soldOut = remaining <= 0;
  const ratio = total > 0 ? remaining / total : 0;
  const low = !soldOut && ratio <= 0.2;

  const tone = soldOut
    ? "border-flame text-flame"
    : low
      ? "border-flame text-flame pulse-flame"
      : "border-acid text-acid";
  const dot = soldOut || low ? "bg-flame" : "bg-acid";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest ${tone}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {soldOut ? "Sold out" : `Sisa ${remaining} / ${total}`}
    </div>
  );
}
