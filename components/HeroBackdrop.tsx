"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroBackdrop() {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // If the video is already buffered (e.g. served from cache), reveal at once.
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setReady(true);
      return;
    }
    // Safety fallback so the splash can never get stuck on a slow network.
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

      {/* Full-bleed background video */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          ref={videoRef}
          src="/hero-secetion-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/footer.jpg"
          onLoadedData={() => setReady(true)}
          className="h-full w-full object-cover"
        />
      </div>
    </>
  );
}
