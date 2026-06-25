"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function NavBar() {
  const { user, loading } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-line/40 bg-ink/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-tight text-paper"
        >
          Lonjak
        </Link>
        <nav className="flex items-center gap-5 font-mono text-xs uppercase tracking-[0.2em]">
          <span className="hidden items-center gap-2 text-acid sm:flex">
            <span className="h-2 w-2 rounded-full bg-acid" />
            Live
          </span>
          <Link
            href="/lineup"
            className="text-haze transition-colors hover:text-paper"
          >
            Lineup
          </Link>
          {!loading &&
            (user ? (
              <Link
                href="/profile"
                className="text-haze transition-colors hover:text-paper"
              >
                Profile
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-haze transition-colors hover:text-paper"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-acid px-4 py-2 text-ink transition-colors hover:bg-acid-deep"
                >
                  Sign up
                </Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}
