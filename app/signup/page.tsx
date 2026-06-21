"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Grain from "@/components/Grain";
import MagneticButton from "@/components/MagneticButton";
import { useAuth } from "@/components/AuthProvider";
import { signUp } from "@/lib/auth";

const inputClass =
  "w-full rounded-lg border border-ink-line bg-ink px-4 py-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-haze/50 focus:border-acid";

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { needsConfirmation } = await signUp(email, password, fullName);
      if (needsConfirmation) {
        setNotice(
          "Akun berhasil dibuat. Cek email kamu untuk konfirmasi, lalu masuk."
        );
        setLoading(false);
      } else {
        router.push("/profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-clip px-6 py-16">
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-flame/10 blur-[140px] drift"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="font-display text-xl uppercase tracking-tight">
          Lonjak
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-acid">
          Gabung sebelum drop berikutnya
        </p>
        <h1 className="mt-2 font-display text-6xl uppercase leading-none">Daftar</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-haze">
              Nama lengkap
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Nama kamu"
            />
          </div>
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
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-haze">
              Kata sandi
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && (
            <p className="font-mono text-xs uppercase tracking-widest text-flame">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg border border-acid/40 bg-acid/5 p-3 font-mono text-xs uppercase tracking-widest text-acid">
              {notice}
            </p>
          )}

          <MagneticButton
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-acid px-8 py-4 font-display text-xl uppercase tracking-wide text-ink hover:bg-acid-deep"
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </MagneticButton>
        </form>

        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-haze">
          Sudah punya akun?{" "}
          <Link href="/signin" className="text-acid hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
