"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import MagneticButton from "@/components/MagneticButton";
import { useAuth } from "@/components/AuthProvider";
import { signIn } from "@/lib/auth";

const inputClass =
  "w-full rounded-lg border border-ink-line bg-ink px-4 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-haze/50 focus:border-acid";

export default function SignInPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-clip px-6 py-16">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-acid/10 blur-[140px] drift"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="font-display text-xl uppercase tracking-tight">
          Lonjak
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-acid">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-6xl uppercase leading-none">Sign in</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-haze">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="name@email.com"
            />
          </div>
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-haze">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="font-mono text-xs uppercase tracking-widest text-flame">
              {error}
            </p>
          )}

          <MagneticButton
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep"
          >
            {loading ? "Processing..." : "Sign in"}
          </MagneticButton>
        </form>

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-haze">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-acid hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}
