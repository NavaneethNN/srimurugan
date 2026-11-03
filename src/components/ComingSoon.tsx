"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Reveal from "@/components/Reveal";

interface UpcomingMovie {
  id: number;
  title: string;
  language?: string;
  releaseDate?: string;
  posterUrl?: string;
}

const accentColors = [
  "from-amber-900/60 to-stone-950",
  "from-cyan-900/60 to-blue-950",
  "from-rose-900/60 to-red-950",
  "from-violet-900/60 to-indigo-950",
];

function MovieCard({ movie, index }: { movie: UpcomingMovie; index: number }) {
  const accent = accentColors[index % accentColors.length];
  const date = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-[0_16px_36px_rgba(201,153,58,0.18)]">
      {/* Poster with gradient */}
      <div className={`relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br ${accent}`}>
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 240px, (max-width:1024px) 280px, 300px"
          />
        ) : (
          /* Stylised placeholder when no poster */
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            <svg
              className="h-10 w-10 text-white/25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <path d="m9 9 6 6M15 9l-6 6" />
            </svg>
            <p className="text-center text-xs font-bold uppercase tracking-wider text-white/60">
              {movie.title}
            </p>
          </div>
        )}

        {/* Modern "Coming Soon" ticket ribbon */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-black/60 px-3 py-1 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-gold">
            Coming Soon
          </span>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Info Card */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-gold sm:text-base">
            {movie.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {movie.language && (
              <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                {movie.language}
              </span>
            )}
            {date && (
              <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-muted">
                <svg className="h-3 w-3 text-gold/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{date}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

let cachedUpcoming: UpcomingMovie[] | null = null;

export default function ComingSoon() {
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>(() => cachedUpcoming || []);
  const [loading, setLoading] = useState(() => !cachedUpcoming || cachedUpcoming.length === 0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isHovered, setIsHovered] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/upcoming")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.upcoming)) {
          cachedUpcoming = d.upcoming;
          setUpcoming(d.upcoming);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateScrollState = () => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
    setProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [upcoming]);

  // Polite auto-scroll every 4.5 seconds with pause on hover
  useEffect(() => {
    if (upcoming.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      const cardWidth = 300; // approximate card step

      if (scrollLeft >= maxScroll - 15) {
        // loop back to start
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [upcoming.length, isHovered]);

  const scrollPrev = () => {
    const el = carouselRef.current;
    if (!el) return;
    const cardStep = el.clientWidth * 0.75;
    el.scrollBy({ left: -cardStep, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = carouselRef.current;
    if (!el) return;
    const cardStep = el.clientWidth * 0.75;
    el.scrollBy({ left: cardStep, behavior: "smooth" });
  };

  return (
    <section id="coming-soon" className="bg-surface py-16 sm:py-20 lg:py-24">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Modern Section Header with Integrated Controls */}
        <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 sm:flex-row sm:items-end">
          <div>
            <p className="section-label">Upcoming Releases</p>
            <h2 className="section-title">Coming Soon</h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Exciting releases hitting Sri Murugan screens soon — stay tuned for ticket bookings.
            </p>
          </div>

          {!loading && upcoming.length > 0 && (
            <div className="flex items-center gap-4 self-start sm:self-end">
              {/* Segmented Progress Track */}
              <div className="hidden sm:flex items-center gap-2.5">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                  Slide Reel
                </span>
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#2a2620]">
                  <div
                    className="h-full rounded-full bg-gold transition-[width] duration-300"
                    style={{ width: `${Math.max(20, progress * 100)}%` }}
                  />
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={scrollPrev}
                  disabled={!canScrollLeft}
                  aria-label="Previous upcoming movies"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-card text-foreground shadow-sm transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-surface-border disabled:hover:text-foreground"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={scrollNext}
                  disabled={!canScrollRight}
                  aria-label="Next upcoming movies"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-border bg-card text-foreground shadow-sm transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-surface-border disabled:hover:text-foreground"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <p className="text-center text-sm tracking-wider text-muted">Loading upcoming movies…</p>
        )}

        {!loading && upcoming.length === 0 && (
          <p className="text-center text-sm text-muted">No upcoming movies yet.</p>
        )}

        {!loading && upcoming.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Native Scroll-Snap Carousel Container */}
            <div
              ref={carouselRef}
              onScroll={updateScrollState}
              className="touch-scroll-x flex gap-5 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x snap-mandatory no-scrollbar"
            >
              {upcoming.map((m, i) => (
                <div
                  key={m.id}
                  className="snap-start shrink-0 w-[240px] sm:w-[265px] md:w-[280px] lg:w-[295px]"
                >
                  <MovieCard movie={m} index={i} />
                </div>
              ))}
            </div>

            {/* Mobile Progress Bar */}
            <div className="mt-4 flex justify-center sm:hidden">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-[#2a2620]">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-300"
                  style={{ width: `${Math.max(25, progress * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}
