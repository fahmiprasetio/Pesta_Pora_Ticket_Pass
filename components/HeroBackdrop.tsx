"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroBackdrop() {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Pengaman: splash tidak akan macet di jaringan lambat.
    const timer = setTimeout(() => setReady(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Splash / loading screen */}
      <div
        aria-hidden={ready}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink transition-opacity duration-700 ${
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <span className="font-display text-4xl uppercase tracking-[0.35em] text-paper md:text-6xl">
          Pestapora
        </span>
        <span className="mt-8 h-10 w-10 animate-spin rounded-full border-2 border-ink-line border-t-acid" />
        <span className="mt-5 font-mono text-[11px] uppercase tracking-[0.4em] text-haze">
          Loading the drop
        </span>
      </div>

      {/* Video hero — selalu tampil di SEMUA perangkat (bukan footer.jpg) */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
        <video
          ref={videoRef}
          src="/hero-secetion-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          onCanPlay={() => videoRef.current?.play().catch(() => {})}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Gradient bawah agar teks terbaca */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
    </>
  );
}
