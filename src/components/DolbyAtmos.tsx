"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useInView } from "@/lib/useInView";

const speakerPoints = [
  { x: 120, y: 60 },
  { x: 190, y: 52 },
  { x: 250, y: 48 },
  { x: 310, y: 52 },
  { x: 380, y: 60 },
  { x: 40, y: 120 },
  { x: 35, y: 170 },
  { x: 30, y: 220 },
  { x: 460, y: 120 },
  { x: 465, y: 170 },
  { x: 470, y: 220 },
];

const particlePaths = [
  "M250,48 C250,100 250,160 250,200",
  "M190,52 C210,90 230,150 250,200",
  "M310,52 C290,90 270,150 250,200",
  "M120,60 C170,90 210,140 250,200",
  "M380,60 C330,90 290,140 250,200",
  "M40,120 C120,140 190,180 250,200",
  "M460,120 C380,140 310,180 250,200",
  "M30,220 C120,220 180,210 250,200",
  "M470,220 C380,220 320,210 250,200",
];

export default function DolbyAtmos() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [bars, setBars] = useState<number[]>(Array(16).fill(10));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(Array.from({ length: 16 }, () => 6 + Math.random() * 44));
    }, 120);
    return () => clearInterval(interval);
  }, []);

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

  const roomTilt = mouse.y * 6 + mouse.x * 4;
  const focusX = 250 + mouse.x * 100;
  const focusY = 150 + mouse.y * 60;

  return (
    <section
      id="atmos"
      className="relative overflow-hidden bg-surface py-20 sm:py-24 lg:py-28"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_52%,rgba(201,153,58,0.09),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,rgba(168,85,247,0.1),transparent_42%)]" />
      <hr className="gold-rule absolute inset-x-0 top-0" />
      <hr className="gold-rule absolute inset-x-0 bottom-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div
            ref={textRef}
            className={`order-2 reveal-group from-right ${textInView ? "is-visible" : ""}`}
          >
            <p className="reveal-item stagger-1 section-label">
              Three-Dimensional Sound
            </p>
            <h2 className="reveal-item stagger-2 mt-3 text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl lg:text-5xl">
              64-Channel<br />
              <span className="text-gold">Dolby Atmos</span>
            </h2>
            <p className="reveal-item stagger-3 mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-[0.95rem]">
              Sound is no longer just around you — it moves above, below and
              through you. With 64 independent channels, every whisper, roar and
              raindrop is placed precisely in three-dimensional space.
            </p>
            <ul className="mt-7 space-y-3.5 text-sm text-muted">
              {[
                "Overhead and surround speakers for true 3D audio",
                "64 discrete audio channels",
                "Object-based sound that follows the action",
                "Deep, immersive bass without distortion",
              ].map((item, i) => {
                const delays = ["stagger-3", "stagger-4", "stagger-5", "stagger-5"];
                return (
                  <li
                    key={item}
                    className={`reveal-item ${delays[i]} flex items-start gap-3`}
                  >
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            ref={visualRef}
            className={`order-1 relative h-72 w-full sm:h-80 lg:h-96 reveal-group from-left ${visualInView ? "is-visible" : ""}`}
          >
            <svg
              className="reveal-item stagger-3 h-full w-full"
              viewBox="0 0 500 300"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
            >
              <defs>
                <radialGradient id="waveGrad" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="speakerGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#d4a84b" />
                </linearGradient>
                <linearGradient id="soundText" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#d4a84b" />
                </linearGradient>
                <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a1f2a" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.95" />
                </linearGradient>
                <filter id="atmosGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* room shell */}
              <g transform={`rotate(${roomTilt}, 250, 150)`}>
                <polygon
                  points="15,260 485,260 430,45 70,45"
                  fill="url(#roomGrad)"
                  stroke="#3a2a3a"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <line x1="70" y1="45" x2="15" y2="260" stroke="#3a2a3a" opacity="0.35" />
                <line x1="430" y1="45" x2="485" y2="260" stroke="#3a2a3a" opacity="0.35" />
                <line x1="250" y1="45" x2="250" y2="260" stroke="#3a2a3a" opacity="0.25" />
                <line x1="70" y1="45" x2="430" y2="45" stroke="#3a2a3a" opacity="0.25" />
                <line x1="15" y1="260" x2="485" y2="260" stroke="#3a2a3a" opacity="0.25" />

                {/* speakers with layered wavefronts */}
                {speakerPoints.map((sp, i) => (
                  <g key={i}>
                    {/* speaker enclosure */}
                    <g transform={`translate(${sp.x}, ${sp.y}) rotate(${sp.x < 100 ? 90 : sp.x > 400 ? -90 : 0})`}>
                      <rect
                        x="-9"
                        y="-6"
                        width="18"
                        height="12"
                        rx="3"
                        fill="#141414"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                      />
                      <circle r="2.5" fill="#c084fc" filter="url(#atmosGlow)" />
                      <rect
                        x="-6"
                        y="-3"
                        width="12"
                        height="6"
                        rx="1.5"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="0.8"
                        opacity="0.5"
                      />
                    </g>
                    <circle
                      cx={sp.x}
                      cy={sp.y}
                      r="10"
                      fill="none"
                      stroke="url(#waveGrad)"
                      strokeWidth="1"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="10;38"
                        begin={`${i * 0.1}s`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0"
                        begin={`${i * 0.1}s`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={sp.x}
                      cy={sp.y}
                      r="10"
                      fill="none"
                      stroke="url(#waveGrad)"
                      strokeWidth="1"
                      opacity="0.5"
                    >
                      <animate
                        attributeName="r"
                        values="10;55"
                        begin={`${i * 0.1 + 0.4}s`}
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0"
                        begin={`${i * 0.1 + 0.4}s`}
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                ))}

                {/* sound-object particles travelling to listener */}
                {particlePaths.map((path, i) => (
                  <circle key={i} r="2.5" fill="#c084fc" filter="url(#atmosGlow)">
                    <animateMotion
                      path={path}
                      begin={`${i * 0.3}s`}
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      begin={`${i * 0.3}s`}
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values="2;3.5;2"
                      begin={`${i * 0.3}s`}
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}

                {/* listener / focal point */}
                <g transform={`translate(${focusX - 250}, ${focusY - 150})`}>
                  <circle cx="250" cy="200" r="10" fill="#141414" stroke="#a855f7" strokeWidth="2" />
                  <circle cx="250" cy="200" r="5" fill="#c084fc" filter="url(#atmosGlow)" />
                  <path
                    d="M235 225 Q250 212 265 225"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.6"
                  />
                  <circle
                    cx="250"
                    cy="200"
                    r="20"
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth="1"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      values="20;45"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>

                {/* channel level meters */}
                <g transform="translate(0, 265)">
                  {bars.map((h, i) => (
                    <rect
                      key={i}
                      x={105 + i * 18}
                      y={-h}
                      width="10"
                      height={h}
                      rx="1"
                      fill="url(#barGrad)"
                      opacity="0.9"
                    />
                  ))}
                </g>

                <text
                  x="250"
                  y="295"
                  textAnchor="middle"
                  fill="url(#soundText)"
                  fontSize="12"
                  fontWeight="bold"
                  letterSpacing="0.2em"
                  opacity="0.8"
                >
                  64 CHANNEL
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
