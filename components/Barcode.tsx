const BARS = [
  3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 1, 2, 4,
  1, 2, 3, 1, 1, 2,
];

export default function Barcode({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-12 items-end gap-[2px] ${className}`} aria-hidden="true">
      {BARS.map((w, i) => (
        <span
          key={i}
          className="block h-full bg-ink"
          style={{ width: `${w}px`, opacity: i % 5 === 0 ? 0.55 : 1 }}
        />
      ))}
    </div>
  );
}
