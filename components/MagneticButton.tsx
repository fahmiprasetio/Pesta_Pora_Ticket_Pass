"use client";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
};

export default function MagneticButton({
  children,
  onClick,
  disabled,
  className = "",
  type = "button",
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
  }

  function reset() {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`relative inline-flex items-center justify-center transition-transform duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
