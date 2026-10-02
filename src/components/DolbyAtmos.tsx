"use client";

import Image from "next/image";
import { useInView } from "@/lib/useInView";

export default function DolbyAtmos() {
  const { ref: textRef,   inView: textInView   } = useInView<HTMLDivElement>();
  const { ref: visualRef, inView: visualInView } = useInView<HTMLDivElement>();

  return (
    <section
      id="atmos"
      className="relative overflow-hidden bg-surface py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_52%,rgba(201,153,58,0.09),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_28%,rgba(168,85,247,0.1),transparent_42%)]" />
      <hr className="gold-rule absolute inset-x-0 top-0" />
      <hr className="gold-rule absolute inset-x-0 bottom-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* ── Text ── */}
          <div
            ref={textRef}
            className={`order-2 reveal-group from-right ${textInView ? "is-visible" : ""}`}
          >
            <p className="reveal-item stagger-1 section-label">
              Three-Dimensional Sound
            </p>
            <h2 className="reveal-item stagger-2 mt-3 text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl lg:text-5xl">
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
                  <li key={item} className={`reveal-item ${delays[i]} flex items-start gap-3`}>
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Image ── */}
          <div
            ref={visualRef}
            className={`order-1 reveal-group from-left ${visualInView ? "is-visible" : ""}`}
          >
            <div className="relative overflow-hidden rounded-2xl border border-card-border shadow-[0_20px_50px_rgba(60,39,21,.12)]">
              <Image
                src="/dolby.png"
                alt="64-Channel Dolby Atmos Sound System"
                width={800}
                height={500}
                unoptimized
                className="h-auto w-full object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-surface/60 to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
