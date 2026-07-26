"use client";

import { useEffect, useState } from "react";
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
    <article className="pro-card group overflow-hidden">
      {/* Poster */}
      <div className={`relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br ${accent}`}>
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
          />
        ) : (
          /* Stylised placeholder when no poster */
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
            <svg className="h-10 w-10 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <path d="m9 9 6 6M15 9l-6 6" />
            </svg>
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-white/60">
              {movie.title}
            </p>
          </div>
        )}

        {/* "Coming Soon" ribbon */}
        <div className="absolute left-0 top-4 bg-gold px-3 py-0.5">
          <span className="text-[0.58rem] font-bold uppercase tracking-widest text-background">
            Coming Soon
          </span>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p className="truncate text-[0.82rem] font-semibold text-white">{movie.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {movie.language && (
            <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold">
              {movie.language}
            </span>
          )}
          {date && (
            <span className="text-[0.65rem] text-muted">{date}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ComingSoon() {
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [current,  setCurrent]  = useState(0);
  const [visible,  setVisible]  = useState(4);

  useEffect(() => {
    fetch("/api/upcoming")
      .then((r) => r.json())
      .then((d) => setUpcoming(d.upcoming || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setVisible(w >= 1024 ? 4 : w >= 640 ? 2 : 1);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const maxIndex  = Math.max(0, upcoming.length - visible);
  const safeCur   = Math.min(current, maxIndex);

  useEffect(() => {
    if (maxIndex <= 0) return;
    const id = setInterval(() => setCurrent((i) => (i >= maxIndex ? 0 : i + 1)), 3000);
    return () => clearInterval(id);
  }, [maxIndex]);

  return (
    <section id="coming-soon" className="bg-surface py-16 sm:py-20 lg:py-24">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-2 text-center sm:mb-12">
          <p className="section-label">Upcoming</p>
          <h2 className="section-title">Coming Soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Exciting releases hitting our screens soon — stay tuned for bookings.
          </p>
        </div>

        {loading && (
          <p className="text-center text-sm text-white/40 tracking-wider">Loading…</p>
        )}

        {!loading && upcoming.length === 0 && (
          <p className="text-center text-sm text-muted">No upcoming movies yet.</p>
        )}

        {!loading && upcoming.length > 0 && upcoming.length <= visible && (
          <div className="flex flex-wrap justify-center gap-5">
            {upcoming.map((m, i) => (
              <div key={m.id} className="w-full max-w-[200px] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
                <MovieCard movie={m} index={i} />
              </div>
            ))}
          </div>
        )}

        {!loading && upcoming.length > visible && (
          <div className="relative">
            {/* Track */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  width: `${(upcoming.length / visible) * 100}%`,
                  transform: `translateX(-${(safeCur * 100) / upcoming.length}%)`,
                }}
              >
                {upcoming.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex-shrink-0 px-2.5"
                    style={{ width: `${100 / upcoming.length}%` }}
                  >
                    <MovieCard movie={m} index={i} />
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow buttons */}
            {safeCur > 0 && (
              <button
                type="button"
                onClick={() => setCurrent((i) => Math.max(i - 1, 0))}
                aria-label="Previous"
                className="absolute -left-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-card-border bg-card text-gold shadow-lg transition hover:border-gold/50 sm:-left-5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            )}
            {safeCur < maxIndex && (
              <button
                type="button"
                onClick={() => setCurrent((i) => Math.min(i + 1, maxIndex))}
                aria-label="Next"
                className="absolute -right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-card-border bg-card text-gold shadow-lg transition hover:border-gold/50 sm:-right-5"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            )}

            {/* Dot indicators */}
            <div className="mt-6 flex justify-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === safeCur ? "h-2 w-5 bg-gold" : "h-1.5 w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}
