export default function Marquee({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  const sequence = [...items, ...items];
  return (
    <div className="relative flex overflow-hidden border-y border-ink-line bg-ink-soft py-4">
      <div className={`marquee-track ${reverse ? "reverse" : ""}`}>
        {sequence.map((item, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center font-display text-2xl uppercase tracking-wide text-paper/80"
          >
            {item}
            <span className="ml-6 h-2 w-2 rotate-45 bg-acid" />
          </span>
        ))}
      </div>
    </div>
  );
}
