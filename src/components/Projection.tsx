"use client";

import Image from "next/image";
import { useEffect } from "react";
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
  const { ref: textRef,   inView: textInView   } = useInView<HTMLDivElement>();
  const { ref: visualRef, inView: visualInView } = useInView<HTMLDivElement>();

  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 80 });
  }, []);

  return (
    <section
      id="projection"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
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
              className="mt-3 text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl lg:text-5xl"
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

          {/* ── Image ── */}
          <div
            ref={visualRef}
            className={`order-1 lg:order-2 reveal-group from-right ${visualInView ? "is-visible" : ""}`}
            data-aos="fade-up"
            data-aos-duration="700"
          >
            <div className="relative overflow-hidden rounded-2xl border border-card-border shadow-[0_20px_50px_rgba(60,39,21,.12)]">
              <Image
                src="/4k.png"
                alt="4K Barco Laser Projection"
                width={800}
                height={500}
                unoptimized
                className="h-auto w-full object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              {/* subtle gold bottom gradient so it blends with the section bg */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
