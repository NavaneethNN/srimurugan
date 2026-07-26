"use client";

import Image from "next/image";
import Reveal from "@/components/Reveal";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const items = [
  { src: "/1_(2)_1671424715600.avif", label: "Auditorium",  span: "lg:col-span-2 lg:row-span-2" },
  { src: "/3_(1)_1671424648485.avif", label: "Projection",  span: "" },
  { src: "/images.jpeg",              label: "Lobby",       span: "" },
  { src: "/hero-cinema.png",          label: "Exterior",    span: "lg:col-span-2" },
];

export default function Gallery() {
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  return (
    <section id="gallery" className="bg-background py-20 sm:py-24 lg:py-28">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2 text-center sm:mb-12">
          <p className="section-label">Inside the Theatre</p>
          <h2 className="section-title">Gallery</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            A glimpse into the Sri Murugan Cinema experience.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-xl border border-card-border bg-card ${item.span}`}
              style={{ aspectRatio: item.span.includes("row-span-2") ? "auto" : "4/3" }}
              data-aos="zoom-in"
              data-aos-delay={`${i * 80}`}
              data-aos-duration="600"
            >
              {/* Make tall card taller on lg */}
              <div className={item.span.includes("row-span-2") ? "relative h-full min-h-[280px] lg:min-h-[420px]" : "relative aspect-[4/3]"}>
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-600 group-hover:scale-[1.04]"
                  sizes="(max-width:640px) 50vw,(max-width:1024px) 50vw,33vw"
                />
                {/* dark overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* label — revealed on hover */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent px-4 py-4 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="text-[0.7rem] font-bold uppercase tracking-widest text-white/90">
                    {item.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
