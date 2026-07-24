"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroParticles = dynamic(() => import("./HeroParticles"), {
  ssr: false,
});

const features = [
  {
    icon: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
        <path d="M7 8h.01M12 8h.01M17 8h.01" />
      </svg>
    ),
    title: "4K",
    sub: "PROJECTION",
  },
  {
    icon: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10v3" />
        <path d="M6 6v11" />
        <path d="M10 3v18" />
        <path d="M14 8v7" />
        <path d="M18 5v13" />
        <path d="M22 10v3" />
      </svg>
    ),
    title: "DOLBY",
    sub: "ATMOS",
  },
  {
    icon: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    title: "PUSH BACK",
    sub: "SEATING",
  },
  {
    icon: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M8 8a8 8 0 0 0 8 0" />
        <path d="M8 16a8 8 0 0 1 8 0" />
      </svg>
    ),
    title: "AIR",
    sub: "CONDITIONED",
  },
];

export default function Hero() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const imageTransform = {
    transform: `translate(${mouse.x * -12}px, ${mouse.y * -8}px) scale(1.08)`,
  };

  return (
    <section id="home" className="relative flex h-screen min-h-[600px] w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform" style={imageTransform}>
        <Image
          src="/hero-cinema.png"
          alt="Sri Murugan Cinema Hall"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />

      <HeroParticles className="absolute inset-0 z-[1] opacity-60" />

      {/* soft pulsing gold glow behind the title, adds depth on dark mobile screens */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] z-[1] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25 blur-[90px] animate-glow-pulse sm:h-[420px] sm:w-[420px]" />

      {/* faint film-grain texture for a cinematic finish */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 0.6px, transparent 0.6px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="relative z-10 flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-24 text-center sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pb-32">
        <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-10">
          <div className="animate-text-reveal flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.5em] text-white/80 sm:text-xs sm:tracking-[0.55em]">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/70" />
            EXPERIENCE
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/70" />
          </div>

          <h1>
            <span className="animate-text-reveal delay-200 block bg-gradient-to-b from-gold via-[#f5d06a] to-[#b4862e] bg-clip-text text-6xl font-black tracking-[0.08em] text-transparent drop-shadow-[0_0_35px_rgba(212,168,75,0.5)] sm:text-7xl md:text-8xl lg:text-9xl">
              CINEMA
            </span>
            <span className="font-dancing animate-text-reveal delay-400 mt-1 block text-2xl font-normal italic text-white drop-shadow-lg sm:mt-2 sm:text-4xl md:text-5xl">
              Like Never Before!
            </span>
            <span className="mx-auto mt-2 block h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent sm:mt-3 sm:w-28" />
          </h1>

          <p className="animate-text-reveal delay-500 max-w-sm px-2 text-sm leading-relaxed text-white/70 sm:max-w-lg sm:px-0 sm:text-base">
            Premium sound, stunning visuals and unmatched comfort at
            Coimbatore&apos;s finest movie theatre.
          </p>

          <div className="animate-fade-in-up delay-600 grid w-full max-w-md grid-cols-4 gap-2 px-1 sm:max-w-xl sm:gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col items-center gap-1 overflow-hidden rounded border border-white/10 bg-white/5 px-1 py-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white/10 sm:gap-2 sm:py-4"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,168,75,0.18),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative text-gold drop-shadow-[0_0_8px_rgba(212,168,75,0.4)]">{f.icon}</div>
                <div className="relative text-center leading-none">
                  <p className="text-[0.6rem] font-bold text-white sm:text-xs">{f.title}</p>
                  <p className="mt-0.5 text-[0.5rem] tracking-wider text-white/60 sm:text-[0.6rem]">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="animate-fade-in-up delay-800">
            <div className="animate-pulse-glow inline-block rounded">
              <Link
                href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded border border-gold bg-gold/90 px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-105 hover:bg-gold sm:px-8 sm:py-4 sm:text-base"
              >
                <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] skew-x-[-20deg] bg-white/40 transition-transform duration-700 group-hover:translate-x-[450%]" />
                <span className="relative">BOOK TICKETS NOW</span>
                <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* scroll cue pinned near the bottom, independent of the centered content flow */}
      <div className="animate-fade-in-up delay-1000 absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-20">
        <span className="text-[0.6rem] font-medium tracking-[0.35em] text-white/50">
          SCROLL
        </span>
        <svg
          className="h-4 w-4 animate-bounce-slow text-white/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 z-10 h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <style jsx global>{`
        @keyframes glow-pulse {
          0%,
          100% {
            opacity: 0.35;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }
        .animate-glow-pulse {
          animation: glow-pulse 5s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(6px);
            opacity: 1;
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}