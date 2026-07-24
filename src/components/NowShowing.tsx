"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

interface Showtime {
  id: number;
  time: string;
  format: string;
}

interface Movie {
  id: number;
  title: string;
  language?: string;
  certification?: string;
  dimension?: string;
  posterUrl?: string;
  showtimes: Showtime[];
}

const gradients = [
  "from-amber-900/80 to-stone-900",
  "from-yellow-900/80 to-neutral-900",
  "from-emerald-900/80 to-stone-900",
  "from-red-900/80 to-purple-950",
  "from-cyan-900/80 to-blue-950",
  "from-orange-900/80 to-red-950",
];

function to12HourFormat(time: string) {
  const [hourStr, minuteStr] = time.split(":");
  if (!hourStr || !minuteStr) return time;
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function NowShowing() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selectedTimes, setSelectedTimes] = useState<Record<number, string | null>>({});

  useEffect(() => {
    fetch("/api/movies")
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.movies || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (loading) {
    return (
      <section
        id="now-showing"
        className="relative flex min-h-[60vh] items-center justify-center bg-background"
      >
        <div className="text-center text-white/60">Loading movies...</div>
      </section>
    );
  }

  if (movies.length === 0) {
    return (
      <section
        id="now-showing"
        className="relative flex min-h-[60vh] items-center justify-center bg-background"
      >
        <div className="text-center text-white/60">No movies currently showing.</div>
      </section>
    );
  }

  const movie = movies[current];
  const activeTime = selectedTimes[movie.id];

  return (
    <section
      id="now-showing"
      className="relative min-h-screen overflow-hidden pt-20"
    >
      {/* background slides */}
      {movies.map((m, i) => (
        <div
          key={m.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {m.posterUrl ? (
            <Image
              src={m.posterUrl}
              alt={m.title}
              fill
              priority={i === current}
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                gradients[i % gradients.length]
              }`}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/30" />
        </div>
      ))}

      {/* header */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Now Showing
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wider text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
          >
            MANAGE MOVIES
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* movie details */}
      <Reveal className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-end" direction="up">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="rounded bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {movie.certification || "UA"}
              </span>
              {movie.language && (
                <span className="text-sm font-medium text-white/80">
                  {movie.language}
                  {movie.dimension && ` · ${movie.dimension}`}
                </span>
              )}
            </div>

            <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-wide text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
              {movie.title}
            </h2>

            {movie.showtimes.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {movie.showtimes.map((show) => {
                  const active = activeTime === show.time;
                  return (
                    <button
                      key={show.id}
                      onClick={() =>
                        setSelectedTimes((prev) => ({
                          ...prev,
                          [movie.id]: active ? null : show.time,
                        }))
                      }
                      className={`rounded border px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-colors ${
                        active
                          ? "border-gold bg-gold text-background"
                          : "border-white/20 bg-white/5 text-white hover:border-gold hover:bg-gold/10"
                      }`}
                    >
                      {to12HourFormat(show.time)}
                    </button>
                  );
                })}
              </div>
            )}

            <Link
              href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded bg-gold px-8 py-3.5 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-105 hover:bg-gold-dark"
            >
              BOOK TICKETS
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* carousel controls */}
          {movies.length > 1 && (
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={() =>
                  setCurrent((c) => (c - 1 + movies.length) % movies.length)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
                aria-label="Previous movie"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div className="flex gap-2">
                {movies.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      i === current ? "bg-gold" : "bg-white/30 hover:bg-white/60"
                    }`}
                    aria-label={`Go to movie ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrent((c) => (c + 1) % movies.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
                aria-label="Next movie"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
