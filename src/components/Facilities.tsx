"use client";

import Reveal from "@/components/Reveal";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M8 8a8 8 0 0 0 8 0M8 16a8 8 0 0 1 8 0" />
      </svg>
    ),
    title: "Air-Conditioned",
    desc: "Climate-controlled for maximum comfort throughout your visit.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    title: "Push-Back Seating",
    desc: "Ergonomic reclining seats for an extra layer of relaxation.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 20h8M6 20v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M12 2v6M9 8h6M7 16h10" />
      </svg>
    ),
    title: "Food Court",
    desc: "A wide selection of snacks and beverages to enjoy with your film.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
        <path d="M17 17H9a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z" />
        <circle cx="7" cy="7" r="3" />
      </svg>
    ),
    title: "Ample Parking",
    desc: "Spacious and secure parking available right at the venue.",
  },
];

export default function Facilities() {
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  return (
    <section id="features" className="bg-background py-20 sm:py-24 lg:py-28">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-2 text-center">
          <p className="section-label">What We Offer</p>
          <h2 className="section-title">Our Facilities</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="pro-card flex flex-col items-center gap-4 px-4 py-7 text-center sm:px-6 sm:py-8"
              data-aos="fade-up"
              data-aos-delay={`${i * 80}`}
              data-aos-duration="600"
            >
              {/* Icon circle */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/8 text-gold transition-colors duration-300 group-hover:bg-gold/15 sm:h-16 sm:w-16">
                {f.icon}
              </div>

              <div>
                <h3 className="text-[0.82rem] font-bold uppercase tracking-wide text-foreground sm:text-sm">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
