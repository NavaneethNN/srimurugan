"use client";

import { useState, type MouseEvent, useEffect } from "react";
import { useInView } from "@/lib/useInView";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Projection() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const handleLeave = () => setMouse({ x: 0, y: 0 });

  const { ref: textRef, inView: textInView } = useInView<HTMLDivElement>();
  const { ref: visualRef, inView: visualInView } = useInView<HTMLDivElement>();

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
  }, []);

  const sceneTilt = mouse.y * 8 + mouse.x * 6;
  const screenTilt = mouse.y * -5 + mouse.x * -4;

  return (
    <section
      id="projection"
      className="relative overflow-hidden border-y border-[#4fd1c5]/20 bg-background py-16 sm:py-20 lg:py-24"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(212,168,75,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(79,209,197,0.10),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4fd1c5]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#4fd1c5]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div
            ref={textRef}
            className={`order-2 lg:order-1 reveal-group from-left ${textInView ? "is-visible" : ""}`}
          >
            <p
              className="text-xs font-semibold tracking-[0.2em] text-gold uppercase"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              Crystal-Clear Visuals
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-wide text-white uppercase sm:text-4xl lg:text-5xl"
              data-aos="fade-up"
              data-aos-delay="100"
              data-aos-duration="700"
            >
              4K 19B Barco Projection
            </h2>
            <p
              className="mt-4 text-sm leading-relaxed text-muted sm:text-base"
              data-aos="fade-up"
              data-aos-delay="200"
              data-aos-duration="600"
            >
              Every frame is projected in breathtaking 4K clarity. Barco&apos;s
              industry-leading 19B laser engine delivers richer blacks, brighter
              highlights and colours that pull you deeper into the story.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {[
                "True 4K resolution with razor-sharp detail",
                "High-contrast laser projection",
                "Wider colour gamut for lifelike images",
                "Uniform brightness across the entire screen",
              ].map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3"
                  data-aos="fade-up"
                  data-aos-delay={`${300 + i * 80}`}
                  data-aos-duration="500"
                >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
              ))}
            </ul>
          </div>

          <div
            ref={visualRef}
            className={`order-1 relative h-64 w-full sm:h-80 lg:h-96 lg:order-2 reveal-group from-right ${visualInView ? "is-visible" : ""}`}
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
                  <stop offset="0%" stopColor="#4fd1c5" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#d4a84b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4a84b" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="lensGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#4fd1c5" stopOpacity="1" />
                  <stop offset="50%" stopColor="#d4a84b" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#d4a84b" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0f1c1b" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
                <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fd1c5" />
                  <stop offset="100%" stopColor="#d4a84b" />
                </linearGradient>
                <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
                  <rect width="4" height="1" fill="#000" fillOpacity="0.35" />
                </pattern>
                <pattern id="filmPerf" width="20" height="12" patternUnits="userSpaceOnUse">
                  <rect width="20" height="12" fill="#0a0a0a" />
                  <rect x="6" y="4" width="8" height="4" rx="1" fill="#4fd1c5" opacity="0.8" />
                </pattern>
                <radialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* theatre floor and perspective */}
              <path d="M0 320 L600 320" stroke="#1a1a1a" strokeWidth="1" opacity="0.6" />
              <path d="M150 0 L120 340 M450 0 L480 340" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" />

              {/* projector beam */}
              <polygon points="170,200 490,110 490,290 170,230" fill="url(#beam)" opacity="0.55">
                <animate attributeName="opacity" values="0.45;0.65;0.45" dur="3s" repeatCount="indefinite" />
              </polygon>
              <ellipse cx="330" cy="200" rx="160" ry="40" fill="url(#beam)" opacity="0.08">
                <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
              </ellipse>

              {/* projector group */}
              <g transform={`rotate(${sceneTilt}, 170, 200)`}>
                <rect x="130" y="240" width="80" height="40" rx="4" fill="#0f0f0f" stroke="#2a2a2a" strokeWidth="1" />
                <rect x="150" y="230" width="40" height="15" rx="2" fill="#1a1a1a" />
                <rect x="40" y="160" width="150" height="80" rx="10" fill="#0f0f0f" stroke="#d4a84b" strokeWidth="1.5" />
                <rect x="55" y="170" width="100" height="60" rx="6" fill="#1a1a1a" />
                <line x1="60" y1="185" x2="145" y2="185" stroke="#333" strokeWidth="1" />
                <line x1="60" y1="193" x2="145" y2="193" stroke="#333" strokeWidth="1" />
                <line x1="60" y1="201" x2="145" y2="201" stroke="#333" strokeWidth="1" />
                <circle cx="170" cy="200" r="24" fill="#080808" stroke="#d4a84b" strokeWidth="2.5" />
                <circle cx="170" cy="200" r="18" fill="url(#lensGlow)" filter="url(#glow)">
                  <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="70" cy="140" r="18" fill="#0a0a0a" stroke="#4fd1c5" strokeWidth="1" opacity="0.9">
                  <animateTransform attributeName="transform" type="rotate" from="0 70 140" to="360 70 140" dur="8s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="130" r="14" fill="#0a0a0a" stroke="#4fd1c5" strokeWidth="1" opacity="0.9">
                  <animateTransform attributeName="transform" type="rotate" from="0 120 130" to="360 120 130" dur="6s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* travelling light particles */}
              {[0, 0.5, 1, 1.5, 2, 2.5].map((delay, i) => (
                <circle key={i} r="2.5" fill="#f5d06a" opacity="0.9">
                  <animateMotion
                    path={`M170,200 C${260 + i * 10},${190 - i * 14} ${380 - i * 5},${160 + i * 10} 490,${180 + i * 8}`}
                    begin={`${delay}s`}
                    dur="2.8s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="opacity" values="0;1;1;0" begin={`${delay}s`} dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="r" values="3.5;2;3.5" begin={`${delay}s`} dur="2.8s" repeatCount="indefinite" />
                </circle>
              ))}

              {/* dust motes drifting in the beam */}
              {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                <circle key={`dust-${i}`} r="1" fill="#fff" opacity="0.3">
                  <animate attributeName="cy" values={`${160 + (i % 5) * 20};${140 + (i % 5) * 20}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${180 + i * 25};${190 + i * 25}`} dur={`${4 + i * 0.4}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0.5;0" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
                </circle>
              ))}

              {/* cinema screen */}
              <g transform={`rotate(${screenTilt}, 470, 200)`}>
                <rect x="360" y="80" width="240" height="200" rx="6" fill="#050505" stroke="#d4a84b" strokeWidth="3" />
                <rect x="370" y="90" width="220" height="180" rx="4" fill="url(#screenGrad)" />
                <rect x="370" y="82" width="220" height="14" fill="url(#filmPerf)" opacity="0.85" />
                <rect x="370" y="264" width="220" height="14" fill="url(#filmPerf)" opacity="0.85" />
                <rect x="370" y="90" width="220" height="180" fill="url(#scanlines)" opacity="0.25">
                  <animate attributeName="opacity" values="0.15;0.35;0.15" dur="0.15s" repeatCount="indefinite" />
                </rect>
                <rect x="370" y="90" width="220" height="180" fill="url(#screenGlow)" opacity="0.2">
                  <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
                </rect>
                <text
                  x="480"
                  y="185"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="url(#textGrad)"
                  fontSize="64"
                  fontWeight="bold"
                  opacity="0.95"
                  filter="url(#glow)"
                >
                  4K
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
