"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MagneticButton from "@/components/MagneticButton";

export default function QueueStatus() {
  const router = useRouter();
  const [ahead, setAhead] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const totalRef = useRef(1);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = 1800 + Math.floor(Math.random() * 2600);
    totalRef.current = start;
    setAhead(start);

    const duration = 6200;
    const t0 = performance.now();

    function frame(now: number) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAhead(Math.round(start * (1 - eased)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setAhead(0);
        setReady(true);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const total = totalRef.current || 1;
  const current = ahead ?? total;
  const progress = Math.min(100, Math.round((1 - current / total) * 100));
  const barStyle = { width: `${progress}%` };

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-ink-line bg-ink-soft p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-haze">
          Virtual waiting room
        </p>

        {!ready ? (
          <>
            <p className="mt-6 font-mono text-xs uppercase tracking-widest text-haze">
              Ahead of you in line
            </p>
            <p className="font-display text-7xl leading-none text-acid tabular-nums">
              {current.toLocaleString("en-US")}
            </p>
            <p className="mt-2 text-sm text-haze">
              Please wait, we are holding back the traffic surge to keep the server stable.
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 font-display text-5xl uppercase leading-none text-acid">
              Your turn
            </p>
            <p className="mt-2 text-sm text-haze">
              Your purchase slot is open. Continue before the session ends.
            </p>
          </>
        )}

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-ink">
          <div
            className="h-full rounded-full bg-acid transition-[width] duration-200 ease-out"
            style={barStyle}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-haze">
          {progress}% complete
        </p>

        <MagneticButton
          onClick={() => router.push("/checkout")}
          disabled={!ready}
          className="mt-7 w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep"
        >
          {ready ? "Enter Checkout" : "Waiting..."}
        </MagneticButton>
      </div>
    </div>
  );
}
