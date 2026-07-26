"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroParticles from "./HeroParticles";

const badges = [
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4M7 8h.01M12 8h.01M17 8h.01" />
      </svg>
    ),
    label: "4K",
    sub: "Projection",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3" />
      </svg>
    ),
    label: "Dolby",
    sub: "Atmos",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    label: "Push-back",
    sub: "Seating",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M8 8a8 8 0 0 0 8 0M8 16a8 8 0 0 1 8 0" />
      </svg>
    ),
    label: "Air",
    sub: "Conditioned",
  },
];

export default function Hero() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const bgStyle = {
    transform: `translate(${mouse.x * -10}px, ${mouse.y * -7}px) scale(1.06)`,
  };

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[640px] w-full items-center justify-center overflow-hidden"
    >
      {/* Background image with subtle parallax */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform"
        style={bgStyle}
      >
        <Image
          src="/hero-cinema.png"
          alt="Sri Murugan Cinema Hall"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/40" />

      {/* Particles */}
      <HeroParticles className="absolute inset-0 z-[1] opacity-50" />

      {/* Warm glow behind headline */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] z-[1] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-[100px] animate-glow-pulse sm:h-[460px] sm:w-[460px]" />

      {/* Film-grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex h-full w-full max-w-4xl flex-col items-center justify-center px-5 pb-20 pt-28 text-center sm:px-8 sm:pb-24 sm:pt-32">
        <div className="flex flex-col items-center gap-5 sm:gap-7">

          {/* Eyebrow */}
          <p className="animate-text-reveal section-label text-white/60">
            Coimbatore&apos;s Premier Cinema
          </p>

          {/* Main headline */}
          <div className="animate-text-reveal delay-200 flex flex-col items-center gap-1 sm:gap-2">
            <h1 className="bg-gradient-to-b from-[#f0d98a] via-gold to-[#9a7228] bg-clip-text text-[4.5rem] font-black leading-none tracking-[0.06em] text-transparent drop-shadow-[0_2px_30px_rgba(201,153,58,0.4)] sm:text-[6rem] md:text-[7.5rem] lg:text-[9rem]">
              CINEMA
            </h1>
            <p className="font-dancing text-xl font-medium italic text-white/85 sm:text-3xl md:text-4xl">
              Like Never Before
            </p>
            <span className="mt-1 block h-px w-16 rounded-full bg-gradient-to-r from-transparent via-gold/70 to-transparent sm:w-24" />
          </div>

          {/* Sub-copy */}
          <p className="animate-text-reveal delay-400 max-w-sm text-sm leading-relaxed text-white/60 sm:max-w-md sm:text-[0.95rem]">
            Premium sound, stunning 4K visuals and unmatched comfort at
            Coimbatore&apos;s finest movie theatre.
          </p>

          {/* Feature badges */}
          <div className="animate-fade-in-up delay-500 grid w-full max-w-xs grid-cols-4 gap-2 sm:max-w-md sm:gap-3">
            {badges.map((b) => (
              <div
                key={b.label}
                className="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-1 py-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/[0.08] sm:py-4"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,153,58,0.14),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="text-gold/80 group-hover:text-gold transition-colors">{b.icon}</span>
                <span className="relative text-center leading-tight">
                  <span className="block text-[0.62rem] font-bold text-white sm:text-[0.7rem]">{b.label}</span>
                  <span className="block text-[0.5rem] tracking-wider text-white/50 sm:text-[0.58rem]">{b.sub}</span>
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="animate-fade-in-up delay-700">
            <div className="animate-pulse-glow inline-block rounded-[5px]">
              <Link
                href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold group relative overflow-hidden px-8 py-3.5 text-[0.78rem] sm:px-10 sm:py-4"
              >
                {/* shimmer sweep */}
                <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full skew-x-[-18deg] bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]" />
                <span className="relative">Book Tickets Now</span>
                <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="animate-fade-in-up delay-1000 absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-12">
        <span className="text-[0.6rem] font-semibold tracking-[0.4em] text-white/35 uppercase">Scroll</span>
        <svg
          className="h-4 w-4 animate-bounce-slow text-white/35"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>

      {/* Bottom gold rule */}
      <div className="absolute bottom-0 left-0 z-10 w-full">
        <hr className="gold-rule" />
      </div>
    </section>
  );
}
