"use client";

import { useState, type MouseEvent, useEffect } from "react";
import { useInView } from "@/lib/useInView";
import AOS from "aos";
import "aos/dist/aos.css";

const bullets = [
  "True 4K resolution with razor-sharp detail",
  "High-contrast laser projection engine",
  "Wider colour gamut for lifelike images",
  "Uniform brightness across the entire screen",
];

export default function Projection() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };
  const handleLeave = () => setMouse({ x: 0, y: 0 });

  const { ref: textRef,   inView: textInView   } = useInView<HTMLDivElement>();
  const { ref: visualRef, inView: visualInView } = useInView<HTMLDivElement>();

  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  const sceneTilt  = mouse.y * 8  + mouse.x * 6;
  const screenTilt = mouse.y * -5 + mouse.x * -4;

  return (
    <section
      id="projection"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_55%,rgba(201,153,58,0.1),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_28%,rgba(79,209,197,0.07),transparent_38%)]" />
      <hr className="gold-rule absolute inset-x-0 top-0" />
      <hr className="gold-rule absolute inset-x-0 bottom-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Text ── */}
          <div
            ref={textRef}
            className={`order-2 lg:order-1 reveal-group from-left ${textInView ? "is-visible" : ""}`}
          >
            <p className="section-label" data-aos="fade-up" data-aos-duration="550">
              Crystal-Clear Visuals
            </p>
            <h2
              className="mt-3 text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl lg:text-5xl"
              data-aos="fade-up"
              data-aos-delay="80"
              data-aos-duration="650"
            >
              4K Barco<br />
              <span className="text-gold">Laser Projection</span>
            </h2>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-[0.95rem]"
              data-aos="fade-up"
              data-aos-delay="160"
              data-aos-duration="600"
            >
              Every frame is projected in breathtaking 4K clarity. Barco&apos;s
              industry-leading 19B laser engine delivers richer blacks, brighter
              highlights and colours that pull you deeper into the story.
            </p>

            <ul className="mt-7 space-y-3.5">
              {bullets.map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-muted"
                  data-aos="fade-up"
                  data-aos-delay={`${240 + i * 70}`}
                  data-aos-duration="500"
                >
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── SVG visual ── */}
          <div
            ref={visualRef}
            className={`order-1 relative h-64 w-full sm:h-80 lg:order-2 lg:h-96 reveal-group from-right ${visualInView ? "is-visible" : ""}`}
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 600 340"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              data-aos="zoom-in"
              data-aos-duration="800"
            >
              <defs>
                <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#4fd1c5" stopOpacity="0.9" />
                  <stop offset="35%"  stopColor="#c9993a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#c9993a" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="lensGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%"   stopColor="#4fd1c5" stopOpacity="1" />
                  <stop offset="50%"  stopColor="#c9993a" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#c9993a" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#0f1c1b" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
                <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#4fd1c5" />
                  <stop offset="100%" stopColor="#c9993a" />
                </linearGradient>
                <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
                  <rect width="4" height="1" fill="#000" fillOpacity="0.35" />
                </pattern>
                <pattern id="filmPerf" width="20" height="12" patternUnits="userSpaceOnUse">
                  <rect width="20" height="12" fill="#0a0a0a" />
                  <rect x="6" y="4" width="8" height="4" rx="1" fill="#4fd1c5" opacity="0.8" />
                </pattern>
                <radialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%"   stopColor="#fff" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* projector beam */}
              <polygon points="170,200 490,110 490,290 170,230" fill="url(#beam)" opacity="0.55">
                <animate attributeName="opacity" values="0.45;0.65;0.45" dur="3s" repeatCount="indefinite" />
              </polygon>

              {/* projector body */}
              <g transform={`rotate(${sceneTilt},170,200)`}>
                <rect x="130" y="240" width="80" height="40" rx="4" fill="#0f0f0f" stroke="#2a2a2a" strokeWidth="1" />
                <rect x="150" y="230" width="40" height="15" rx="2" fill="#1a1a1a" />
                <rect x="40"  y="160" width="150" height="80" rx="10" fill="#0f0f0f" stroke="#c9993a" strokeWidth="1.5" />
                <rect x="55"  y="170" width="100" height="60" rx="6"  fill="#1a1a1a" />
                {[185,193,201].map((y) => (
                  <line key={y} x1="60" y1={y} x2="145" y2={y} stroke="#333" strokeWidth="1" />
                ))}
                <circle cx="170" cy="200" r="24" fill="#080808" stroke="#c9993a" strokeWidth="2.5" />
                <circle cx="170" cy="200" r="18" fill="url(#lensGlow)" filter="url(#glow)">
                  <animate attributeName="r"       values="14;22;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;1;0.7"  dur="2s" repeatCount="indefinite" />
                </circle>
                {/* film reels */}
                <circle cx="70"  cy="140" r="18" fill="#0a0a0a" stroke="#4fd1c5" strokeWidth="1" opacity="0.9">
                  <animateTransform attributeName="transform" type="rotate" from="0 70 140"   to="360 70 140"   dur="8s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="130" r="14" fill="#0a0a0a" stroke="#4fd1c5" strokeWidth="1" opacity="0.9">
                  <animateTransform attributeName="transform" type="rotate" from="0 120 130" to="360 120 130" dur="6s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* light particles along beam */}
              {[0,0.5,1,1.5,2,2.5].map((delay, i) => (
                <circle key={i} r="2.5" fill="#e8be6a" opacity="0.9">
                  <animateMotion
                    path={`M170,200 C${260+i*10},${190-i*14} ${380-i*5},${160+i*10} 490,${180+i*8}`}
                    begin={`${delay}s`} dur="2.8s" repeatCount="indefinite"
                  />
                  <animate attributeName="opacity" values="0;1;1;0" begin={`${delay}s`} dur="2.8s" repeatCount="indefinite" />
                </circle>
              ))}

              {/* screen */}
              <g transform={`rotate(${screenTilt},470,200)`}>
                <rect x="360" y="80" width="240" height="200" rx="6" fill="#050505" stroke="#c9993a" strokeWidth="3" />
                <rect x="370" y="90" width="220" height="180" rx="4" fill="url(#screenGrad)" />
                <rect x="370" y="82"  width="220" height="14" fill="url(#filmPerf)" opacity="0.85" />
                <rect x="370" y="264" width="220" height="14" fill="url(#filmPerf)" opacity="0.85" />
                <rect x="370" y="90" width="220" height="180" fill="url(#scanlines)" opacity="0.25">
                  <animate attributeName="opacity" values="0.15;0.35;0.15" dur="0.15s" repeatCount="indefinite" />
                </rect>
                <rect x="370" y="90" width="220" height="180" fill="url(#screenGlow)" opacity="0.2">
                  <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
                </rect>
                <text x="480" y="185" textAnchor="middle" dominantBaseline="middle" fill="url(#textGrad)" fontSize="18" fontWeight="bold" letterSpacing="4" fontFamily="monospace">4K</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
