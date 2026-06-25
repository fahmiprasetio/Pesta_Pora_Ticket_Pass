"use client";
import { useEffect, useState } from "react";

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function diff(target: number): TimeParts {
  const delta = Math.max(0, target - Date.now());
  return {
    days: Math.floor(delta / 86400000),
    hours: Math.floor((delta % 86400000) / 3600000),
    minutes: Math.floor((delta % 3600000) / 60000),
    seconds: Math.floor((delta % 60000) / 1000),
  };
}

const PADS: { key: keyof TimeParts; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

export default function Countdown({ target }: { target: string | null }) {
  const targetMs = target
    ? new Date(target).getTime()
    : Date.now() + 1000 * 60 * 60 * 24 * 30;
  const [time, setTime] = useState<TimeParts>(() => diff(targetMs));

  useEffect(() => {
    const id = setInterval(() => setTime(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {PADS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center rounded-lg border border-ink-line bg-ink px-2 py-3"
        >
          <span
            key={time[key]}
            className="tick font-display text-3xl leading-none text-acid md:text-4xl"
          >
            {String(time[key]).padStart(2, "0")}
          </span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-haze">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
