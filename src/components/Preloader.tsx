"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf: number;
    let current = 0;

    const tick = () => {
      const increment = current < 80 ? 2 : current < 95 ? 0.5 : 0.15;
      current = Math.min(100, current + increment);
      setProgress(current);

      if (current < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setDone(true), 400);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,168,75,0.08),transparent_60%)]" />

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative h-28 w-28">
          <Image
            src="/logo.png"
            alt="Sri Murugan Cinema"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="h-0.5 w-40 overflow-hidden rounded-full bg-white/10 sm:w-52">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold via-[#f5d06a] to-gold transition-[width] duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-[0.3em] text-white/50">
              SRI MURUGAN CINEMA
            </span>
            <span className="text-xs font-bold tabular-nums text-gold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
