"use client";

import Image from "next/image";
import { useInView } from "@/lib/useInView";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const highlights = [
  {
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    text: "Established in 1971, Sri Murugan Cinema is one of the oldest theatres on Mettupalayam Road, Coimbatore.",
  },
  {
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    text: "Originally built by Mr. Gandhi and acquired by Mr. S. Palaniswamy in 1982, who continues to own and manage it.",
  },
  {
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 21h5v-5" />
      </svg>
    ),
    text: "In November 2018 the theatre underwent a complete refurbishment and reopened with the release of Sarkar.",
  },
  {
    icon: (
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18M19 9l-5 5-4-4-3 3" />
      </svg>
    ),
    text: "Committed to continuous growth with plans to expand by adding more screens in the near future.",
  },
];

export default function About() {
  const { ref: imgRef,  inView: imgInView  } = useInView<HTMLDivElement>();
  const { ref: txtRef,  inView: txtInView  } = useInView<HTMLDivElement>();

  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  return (
    <section id="about" className="relative overflow-hidden bg-surface py-20 sm:py-24 lg:py-28">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(201,153,58,0.07),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_72%,rgba(79,209,197,0.04),transparent_38%)]" />
      <hr className="gold-rule absolute inset-x-0 top-0" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Image column ── */}
          <div
            ref={imgRef}
            className={`relative min-h-[300px] overflow-hidden rounded-2xl border border-card-border shadow-[0_20px_50px_rgba(60,39,21,.12)] sm:min-h-[380px] lg:min-h-[520px] reveal-group from-left ${imgInView ? "is-visible" : ""}`}
          >
            <Image
              src="/about.avif"
              alt="Sri Murugan Cinema interior"
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

            {/* Since badge */}
            <div className="absolute bottom-5 left-5 rounded-lg border border-gold/30 bg-[#21170e]/75 px-4 py-3 backdrop-blur-sm">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold">Since</p>
              <p className="text-2xl font-black text-white">1971</p>
            </div>
          </div>

          {/* ── Content column ── */}
          <div
            ref={txtRef}
            className={`flex flex-col justify-center reveal-group from-right ${txtInView ? "is-visible" : ""}`}
          >
            <p
              className="section-label"
              data-aos="fade-up"
              data-aos-duration="550"
            >
              Our Legacy
            </p>
            <h2
              className="mt-3 text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl lg:text-5xl"
              data-aos="fade-up"
              data-aos-delay="80"
              data-aos-duration="650"
            >
              About Sri Murugan<br />
              <span className="text-gold">Cinema</span>
            </h2>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-[0.95rem]"
              data-aos="fade-up"
              data-aos-delay="140"
              data-aos-duration="600"
            >
              Five decades of cinematic excellence on Mettupalayam Road, now
              reimagined with world-class technology for the modern audience.
            </p>

            {/* Highlights */}
            <ul className="mt-8 space-y-4">
              {highlights.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 rounded-lg border border-transparent p-3 transition-all duration-200 hover:border-gold/10 hover:bg-card"
                  data-aos="fade-up"
                  data-aos-delay={`${200 + i * 80}`}
                  data-aos-duration="550"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    {item.icon}
                  </div>
                  <p className="text-sm leading-relaxed text-muted sm:text-[0.9rem]">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
