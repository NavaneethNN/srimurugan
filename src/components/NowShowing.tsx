"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
  mobileBgUrl?: string;
  desktopBgUrl?: string;
  showtimes: Showtime[];
}

function to12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

const AUTOPLAY_DURATION_MS = 7000;
const TICK_INTERVAL_MS = 50;

let cachedMovies: Movie[] | null = null;

export default function NowShowing() {
  const [movies, setMovies] = useState<Movie[]>(() => cachedMovies || []);
  const [loading, setLoading] = useState(() => !cachedMovies || cachedMovies.length === 0);
  const [current, setCurrent] = useState(0);
  const [selectedTimes, setSelectedTimes] = useState<Record<number, string | null>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/movies")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.movies)) {
          cachedMovies = data.movies;
          setMovies(data.movies);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Smooth progress bar and auto-advance
  useEffect(() => {
    if (movies.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_INTERVAL_MS / AUTOPLAY_DURATION_MS) * 100;
        if (next >= 100) {
          setCurrent((idx) => (idx + 1) % movies.length);
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [movies.length, isPaused]);

  function switchMovie(index: number) {
    setCurrent(index);
    setProgress(0);
  }

  function nextMovie() {
    if (movies.length <= 1) return;
    setCurrent((index) => (index + 1) % movies.length);
    setProgress(0);
  }

  function prevMovie() {
    if (movies.length <= 1) return;
    setCurrent((index) => (index - 1 + movies.length) % movies.length);
    setProgress(0);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null || movies.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextMovie();
      } else {
        prevMovie();
      }
    }
    setTouchStartX(null);
  };

  const movie = movies[current];
  const desktopImage = movie?.desktopBgUrl || movie?.posterUrl;
  const mobileImage = movie?.mobileBgUrl || movie?.desktopBgUrl || movie?.posterUrl;
  const activeTime = movie && selectedTimes[movie.id];

  return (
    <section
      id="now-showing"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden bg-gradient-to-b from-[#0a0806] via-[#0f0c09] to-[#0a0806]"
    >
      {/* Mobile: Full Background Image */}
      {movie && mobileImage && (
        <div className="absolute inset-0 md:hidden">
          <Image
            key={`mobile-bg-${movie.id}-${mobileImage}`}
            src={mobileImage}
            alt={movie.title}
            fill
            priority
            className="object-cover transition-opacity duration-700"
            sizes="100vw"
          />
          {/* Dark Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/95" />
        </div>
      )}

      {/* Background Pattern - Desktop Only */}
      <div
        className="absolute inset-0 hidden opacity-[0.03] md:block"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-10 text-center sm:mb-14">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-gold sm:text-xs">
              Cinema Experience
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
              Now Showing
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-gray-300 sm:text-sm lg:text-base">
              Experience the magic of cinema with crystal-clear 4K Barco Laser projection and Dolby Atmos sound
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-gray-800 border-t-gold" />
                <p className="mt-4 text-xs tracking-wider text-gray-300">Loading current showtimes…</p>
              </div>
            </div>
          ) : !movie ? (
            <div className="rounded-3xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 px-6 py-24 text-center backdrop-blur-sm">
              <svg
                className="mx-auto h-16 w-16 text-gold/70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="15" x="2" y="7" rx="2" />
                <path d="m4 7 3-4h3l-3 4" />
                <path d="m11 7 3-4h3l-3 4" />
              </svg>
              <p className="mt-4 text-xl font-bold text-gray-200">No movies currently showing</p>
              <p className="mt-2 text-sm text-gray-400">Check back soon for upcoming releases</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Stage Presentation */}
              <div className="relative">
                {/* Desktop: Card with Background Image */}
                <div className="hidden md:block">
                  <div className="relative h-[580px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
                    {/* Desktop Background Image with Crossfade */}
                    {desktopImage && (
                      <Image
                        key={`desktop-${movie.id}-${desktopImage}`}
                        src={desktopImage}
                        alt={movie.title}
                        width={1920}
                        height={600}
                        priority
                        className="h-full w-full object-cover transition-opacity duration-700"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                      />
                    )}

                    {!desktopImage && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/60 via-stone-950 to-black" />
                    )}

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-transparent" />

                    {/* Top Floating Glass Badges */}
                    <div className="absolute left-6 top-6 flex items-center gap-3 lg:left-8 lg:top-8">
                      <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-black/60 px-3.5 py-2 backdrop-blur-md shadow-lg">
                        <Image src="/4k.png" alt="4K" width={32} height={32} className="h-6 w-auto" />
                        <div className="h-4 w-px bg-white/20" />
                        <Image src="/dolby.png" alt="Dolby Atmos" width={64} height={32} className="h-6 w-auto" />
                      </div>
                    </div>

                    {/* Top Right Live Indicator */}
                    <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-md lg:right-8 lg:top-8">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[0.68rem] font-bold uppercase tracking-wider text-gray-200">
                        In Theatres Now
                      </span>
                    </div>

                    {/* Bottom Section: Movie Info & Booking */}
                    <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-7xl flex-col justify-end p-8 lg:p-10">
                      <div className="max-w-3xl space-y-4">
                        {/* Featured Film Badge */}
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-3.5 py-1 backdrop-blur-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                          <span className="text-[0.68rem] font-bold uppercase tracking-widest text-gold">
                            Featured Presentation
                          </span>
                        </div>

                        {/* Movie Title */}
                        <h3 className="line-clamp-2 font-[family-name:var(--font-cormorant)] text-5xl font-bold leading-none tracking-tight text-white lg:text-6xl">
                          {movie.title}
                        </h3>

                        {/* Format Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {movie.certification && (
                            <span className="rounded-lg border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                              {movie.certification}
                            </span>
                          )}
                          {movie.language && (
                            <span className="rounded-lg border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold backdrop-blur-sm">
                              {movie.language}
                            </span>
                          )}
                          {movie.dimension && (
                            <span className="rounded-lg border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                              {movie.dimension}
                            </span>
                          )}
                        </div>

                        {/* Showtimes */}
                        {movie.showtimes.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-[0.68rem] font-bold uppercase tracking-widest text-gray-300">
                              Available Showtimes Today
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {movie.showtimes.map((showtime) => {
                                const active = activeTime === showtime.time;
                                return (
                                  <button
                                    key={showtime.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedTimes((previous) => ({
                                        ...previous,
                                        [movie.id]: active ? null : showtime.time,
                                      }))
                                    }
                                    aria-pressed={active}
                                    className={`rounded-xl border px-4 py-2 text-sm font-bold backdrop-blur-md transition-all duration-200 ${
                                      active
                                        ? "border-gold bg-gold text-black shadow-lg shadow-gold/30"
                                        : "border-white/25 bg-black/60 text-white hover:border-gold hover:bg-gold/15 hover:text-gold"
                                    }`}
                                  >
                                    {to12h(showtime.time)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Book Tickets Button & Notice */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <Link
                            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-gold min-h-12 shadow-[0_8px_25px_rgba(201,153,58,0.35)] transition-transform hover:scale-105"
                          >
                            <span>Book Tickets on BookMyShow</span>
                            <span aria-hidden="true">↗</span>
                          </Link>
                          <Link
                            href="/order-food"
                            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:border-gold hover:text-gold"
                          >
                            <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                              <path d="M15 2v19" />
                              <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                              <path d="M9 2v19" />
                            </svg>
                            <span>Order In-Seat Snacks</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile: Full-Screen Background with Touch Swipe */}
                <div
                  className="space-y-6 md:hidden touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-1.5 backdrop-blur-md">
                      <Image src="/4k.png" alt="4K" width={32} height={32} className="h-4 w-auto" />
                      <div className="h-3 w-px bg-white/20" />
                      <Image src="/dolby.png" alt="Dolby Atmos" width={64} height={32} className="h-4 w-auto" />
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 backdrop-blur-md text-[0.62rem] font-bold uppercase tracking-wider text-gray-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Live In Screen</span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-gold">
                      Featured Film
                    </span>
                    <h3 className="mt-2 break-words font-[family-name:var(--font-cormorant)] text-3xl font-bold leading-tight text-white xs:text-4xl">
                      {movie.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {movie.certification && (
                      <span className="rounded-lg border border-white/20 bg-black/60 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white backdrop-blur-sm">
                        {movie.certification}
                      </span>
                    )}
                    {movie.language && (
                      <span className="rounded-lg border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase text-gold backdrop-blur-sm">
                        {movie.language}
                      </span>
                    )}
                    {movie.dimension && (
                      <span className="rounded-lg border border-white/20 bg-black/60 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white backdrop-blur-sm">
                        {movie.dimension}
                      </span>
                    )}
                  </div>

                  {movie.showtimes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-gray-300">
                        Select Showtime
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {movie.showtimes.map((showtime) => {
                          const active = activeTime === showtime.time;
                          return (
                            <button
                              key={showtime.id}
                              type="button"
                              onClick={() =>
                                setSelectedTimes((previous) => ({
                                  ...previous,
                                  [movie.id]: active ? null : showtime.time,
                                }))
                              }
                              aria-pressed={active}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all ${
                                active
                                  ? "border-gold bg-gold text-black shadow-md shadow-gold/30"
                                  : "border-white/30 bg-black/60 text-white hover:border-gold hover:text-gold"
                              }`}
                            >
                              {to12h(showtime.time)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <Link
                      href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold min-h-12 w-full justify-center shadow-lg shadow-gold/30"
                    >
                      <span>Book Tickets on BookMyShow</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                    <Link
                      href="/order-food"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/60 px-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:border-gold hover:text-gold"
                    >
                      <svg className="h-4 w-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                        <path d="M15 2v19" />
                        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                        <path d="M9 2v19" />
                      </svg>
                      <span>Order Food to Your Seat</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Modern Film Strip Selector & Controls Bar */}
              {movies.length > 1 && (
                <div className="mt-8 space-y-4">
                  {/* Control Dock: Slide Index + Chevrons + Play/Pause */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">
                        Featured Cinema Lineup · Tap to Switch Film
                      </p>
                    </div>

                    {/* Sleek Glass Navigation Dock */}
                    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
                      <button
                        type="button"
                        onClick={prevMovie}
                        aria-label="Previous movie"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-gold transition"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>

                      <span className="font-mono text-xs font-bold text-gold px-1">
                        {String(current + 1).padStart(2, "0")}{" "}
                        <span className="text-white/30">/</span>{" "}
                        {String(movies.length).padStart(2, "0")}
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsPaused((prev) => !prev)}
                        aria-label={isPaused ? "Resume auto slideshow" : "Pause auto slideshow"}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-gold transition"
                      >
                        {isPaused ? (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={nextMovie}
                        aria-label="Next movie"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-gold transition"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Movie Film Strip Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {movies.map((m, idx) => {
                      const isActive = idx === current;
                      const thumb = m.posterUrl || m.desktopBgUrl || m.mobileBgUrl;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => switchMovie(idx)}
                          className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-300 ${
                            isActive
                              ? "border-gold/80 bg-gold/15 shadow-[0_0_24px_rgba(201,153,58,0.25)] ring-1 ring-gold"
                              : "border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/60"
                          }`}
                        >
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-900 shadow-sm">
                            {thumb ? (
                              <Image src={thumb} alt={m.title} fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[0.6rem] font-bold text-gold">
                                4K
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-xs font-bold transition-colors ${
                                isActive ? "text-gold" : "text-white group-hover:text-gold"
                              }`}
                            >
                              {m.title}
                            </p>
                            <p className="mt-0.5 truncate text-[0.68rem] text-gray-400">
                              {m.language || "Feature"} · {m.dimension || "4K Atmos"}
                            </p>
                            <p className="text-[0.65rem] font-semibold text-emerald-400">
                              {m.showtimes.length} {m.showtimes.length === 1 ? "Show" : "Shows"} Today
                            </p>
                          </div>

                          {/* Active movie countdown bar */}
                          {isActive && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                              <div
                                className="h-full bg-gold transition-[width] duration-75"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
