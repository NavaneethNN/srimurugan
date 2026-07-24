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

const gradients = [
  "from-orange-900/80 to-red-950",
  "from-amber-900/80 to-stone-900",
  "from-cyan-900/80 to-blue-950",
  "from-yellow-900/80 to-amber-950",
];

function MovieCard({ movie, index }: { movie: UpcomingMovie; index: number }) {
  const gradient = gradients[index % gradients.length];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-card-border bg-card">
      <div className={`relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6 text-center`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="absolute inset-0 object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <h3 className="relative z-10 text-xl font-bold tracking-wider text-white drop-shadow-lg sm:text-2xl">
            {movie.title}
          </h3>
        )}
      </div>
      <div className="p-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-sm font-semibold text-white">{movie.title}</p>
          {movie.language && (
            <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[0.65rem] text-gold">
              {movie.language}
            </span>
          )}
        </div>
        <p className="text-[0.65rem] text-muted sm:text-xs">
          {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : "Coming soon"}
        </p>
      </div>
    </div>
  );
}

export default function ComingSoon() {
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(4);

  useEffect(() => {
    fetch("/api/upcoming")
      .then((res) => res.json())
      .then((data) => {
        setUpcoming(data.upcoming || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      setVisible(w >= 1024 ? 4 : w >= 640 ? 2 : 1);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = Math.max(0, upcoming.length - visible);
  const safeCurrent = Math.min(current, maxIndex);

  useEffect(() => {
    if (maxIndex <= 0) return;
    const id = setInterval(() => {
      setCurrent((i) => (i >= maxIndex ? 0 : i + 1));
    }, 2000);
    return () => clearInterval(id);
  }, [maxIndex]);

  const nextSlide = () => setCurrent((i) => Math.min(i + 1, maxIndex));
  const prevSlide = () => setCurrent((i) => Math.max(i - 1, 0));

  if (loading) {
    return (
      <section id="coming-soon" className="border-y border-card-border bg-card/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center text-white/60">
          Loading upcoming movies...
        </div>
      </section>
    );
  }


  return (
    <section id="coming-soon" className="border-y border-card-border bg-card/30 py-12 sm:py-16">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" direction="up">
        <h2 className="section-title">COMING SOON</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Exciting releases hitting our screens soon. Stay tuned for bookings.
        </p>

        {upcoming.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">No upcoming movies yet.</p>
        ) : upcoming.length <= visible ? (
          <div className="mt-8 flex flex-wrap justify-center gap-5 sm:mt-10">
            {upcoming.map((movie, index) => (
              <div
                key={movie.id}
                className="w-full max-w-xs sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
              >
                <MovieCard movie={movie} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mt-8 overflow-hidden sm:mt-10">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                width: `${(upcoming.length / visible) * 100}%`,
                transform: `translateX(-${(safeCurrent * 100) / upcoming.length}%)`,
              }}
            >
              {upcoming.map((movie, index) => (
                <div
                  key={movie.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / upcoming.length}%` }}
                >
                  <MovieCard movie={movie} index={index} />
                </div>
              ))}
            </div>

            {safeCurrent > 0 && (
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-card-border bg-background/80 p-2 text-gold backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            {safeCurrent < maxIndex && (
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-card-border bg-background/80 p-2 text-gold backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
}
