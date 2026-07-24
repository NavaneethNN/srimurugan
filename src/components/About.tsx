"use client";

import Image from "next/image";
import { useInView } from "@/lib/useInView";

const highlights = [
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
    text: "Established in 1971, Sri Murugan Cinema is one of the oldest theatres on Mettupalayam Road, Coimbatore.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    text: "Originally built by Mr. Gandhi and acquired by Mr. S. Palaniswamy in 1982, who continues to own and manage it.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
      </svg>
    ),
    text: "In November 2018, the theatre underwent a complete refurbishment and reopened with the release of Sarkar.",
  },
  {
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    text: "Sri Murugan Cinema is committed to continuous growth and has plans to expand by adding more screens in the near future.",
  },
];

export default function About() {
  const { ref: imageRef, inView: imageInView } = useInView<HTMLDivElement>();
  const { ref: contentRef, inView: contentInView } = useInView<HTMLDivElement>();

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(212,168,75,0.08),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(79,209,197,0.05),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          <div
            ref={imageRef}
            className={`group relative min-h-[300px] overflow-hidden rounded-2xl border border-card-border sm:min-h-[360px] lg:min-h-[480px] reveal-group from-left ${imageInView ? "is-visible" : ""}`}
          >
            <Image
              src="/about.avif"
              alt="Sri Murugan Cinema"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 rounded-xl border border-gold/30 bg-black/50 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-widest text-gold uppercase">Since</p>
              <p className="text-2xl font-bold text-white">1971</p>
            </div>
          </div>

          <div
            ref={contentRef}
            className={`relative flex flex-col justify-center rounded-2xl border border-card-border bg-card/80 p-6 backdrop-blur-sm sm:p-8 lg:p-10 reveal-group from-right ${contentInView ? "is-visible" : ""}`}
          >
            <p className="reveal-item stagger-1 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              Our Legacy
            </p>
            <h2 className="reveal-item stagger-2 mt-2 text-3xl font-bold tracking-wide text-white uppercase sm:text-4xl lg:text-5xl">
              About Sri Murugan Cinema
            </h2>
            <div className="reveal-item stagger-3 mx-auto mt-4 h-0.5 w-16 bg-gradient-to-r from-transparent via-gold to-transparent sm:mx-0" />

            <div className="mt-8 space-y-5">
              {highlights.map((item, index) => {
                const delays = ["stagger-3", "stagger-4", "stagger-5", "stagger-5"];
                return (
                  <div
                    key={index}
                    className={`reveal-item ${delays[index]} group/item flex gap-4 rounded-xl border border-transparent p-3 transition-all hover:border-gold/10 hover:bg-white/[0.03]`}
                  >
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors group-hover/item:bg-gold/20">
                      {item.icon}
                    </div>
                    <p className="text-sm leading-relaxed text-muted sm:text-base">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
