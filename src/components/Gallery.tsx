"use client";

import Image from "next/image";
import Reveal from "@/components/Reveal";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

/* Keep all images small — no spanning — so low-res sources don't look broken */
const items = [
  { src: "/1_(2)_1671424715600.avif", label: "Seating" },
  { src: "/3_(1)_1671424648485.avif", label: "Cafeteria" },
  { src: "/hero-cinema.png",          label: "Screen" },
  { src: "/images.jpeg",              label: "Auditorium" },
];

export default function Gallery() {
  useEffect(() => {
    AOS.init({ duration: 650, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  return (
    <section id="gallery" className="bg-background py-20 sm:py-24 lg:py-28">
      <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2 text-center sm:mb-12">
          <p className="section-label">Inside the Theatre</p>
          <h2 className="section-title">Gallery</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            A glimpse into the Sri Murugan Cinema experience.
          </p>
        </div>

        {/* Uniform 2-col → 4-col grid. Fixed aspect ratio keeps images small enough to stay sharp. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item, i) => (
            <figure
              key={item.label}
              className="group relative m-0 overflow-hidden rounded-lg border border-card-border bg-card"
              data-aos="fade-up"
              data-aos-delay={`${i * 70}`}
              data-aos-duration="600"
            >
              {/* Fixed aspect ratio — 3:2 keeps it compact and the images remain sharp */}
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 20vw"
                  quality={85}
                />

                {/* Permanent soft vignette at the bottom */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent" />

                {/* Hover overlay tint */}
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Label — always visible, sits inside the gradient */}
              <figcaption className="absolute inset-x-0 bottom-0 px-3 py-2.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/80">
                  {item.label}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
