"use client";
import Link from "next/link";

export default function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-line/40 bg-ink/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-tight transition-colors hover:text-acid"
        >
          Lonjak
        </Link>

        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-widest text-haze">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-acid" />
            Live
          </span>
          <Link href="/lineup" className="transition-colors hover:text-acid">
            Lineup
          </Link>
          <Link
            href="/tickets"
            className="rounded-full border border-ink-line px-4 py-2 text-paper transition-colors hover:border-acid hover:text-acid"
          >
            My Tickets
          </Link>
        </nav>
      </div>
    </header>
  );
}
