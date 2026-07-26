"use client";

import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function HeroParticles({ className }: { className?: string }) {
  const particles = useMemo<Particle[]>(() => {
    const rand = seededRandom(42);
    const colors = ["#d4a84b", "#f5d06a", "#4fd1c5", "#b4862e", "#ffe08a"];
    const count = 120;

    return Array.from({ length: count }, (_, i) => {
      const size = rand() * 3 + 1; // 1–4 px
      return {
        id: i,
        x: rand() * 100,
        y: rand() * 100,
        size,
        color: colors[Math.floor(rand() * colors.length)],
        duration: rand() * 14 + 8,  // 8–22s float cycle
        delay: -(rand() * 20),       // staggered start (negative = already mid-cycle)
        driftX: (rand() - 0.5) * 60, // ±30 vw of horizontal drift
        driftY: -(rand() * 40 + 15), // 15–55 vh upward drift
        opacity: rand() * 0.55 + 0.2,
      };
    });
  }, []);

  return (
    <div className={className} aria-hidden="true" style={{ pointerEvents: "none" }}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="hero-particle"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              "--duration": `${p.duration}s`,
              "--delay": `${p.delay}s`,
              "--drift-x": `${p.driftX}px`,
              "--drift-y": `${p.driftY}vh`,
              "--opacity": p.opacity,
              "--size": `${p.size}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
