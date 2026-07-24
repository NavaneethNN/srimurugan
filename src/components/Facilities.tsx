"use client";

import Reveal from "@/components/Reveal";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const features = [
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M8 8a8 8 0 0 0 8 0" />
        <path d="M8 16a8 8 0 0 1 8 0" />
      </svg>
    ),
    title: "AIR-CONDITIONED",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    title: "PUSH BACK SEATS",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 20h8" />
        <path d="M6 20v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
        <path d="M12 2v6" />
        <path d="M9 8h6" />
        <path d="M7 16h10" />
      </svg>
    ),
    title: "FOOD COURT",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
        <path d="M17 17H9a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z" />
        <circle cx="7" cy="7" r="3" />
      </svg>
    ),
    title: "AMPLE PARKING",
  },
];

export default function Features() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
  }, []);

  return (
    <section id="features" className="border-y border-card-border bg-card/30 py-12 sm:py-16">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">OUR FEATURES</h2>

        {/* Mobile: inline row without cards */}
        <div className="mt-8 flex items-center justify-between gap-2 sm:hidden">
          {features.map((feature, index) => (
            <div key={feature.title} className="flex flex-1 flex-col items-center text-center" data-aos="fade-up" data-aos-delay={`${index * 80}`} data-aos-duration="500">
              <div className="text-gold">{feature.icon}</div>
              <p className="mt-1.5 text-[0.6rem] font-bold leading-tight tracking-wide text-white">
                {feature.title}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: equal-weight cards */}
        <div className="mt-10 hidden grid-cols-4 gap-4 sm:grid lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex h-full flex-col items-center justify-center rounded-xl border border-card-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/40"
              data-aos="zoom-in"
              data-aos-delay={`${index * 100}`}
              data-aos-duration="600"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold tracking-wide text-white sm:text-base">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
