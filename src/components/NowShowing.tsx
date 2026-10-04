"use client";

import { useEffect, useState } from "react";
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

export default function NowShowing() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selectedTimes, setSelectedTimes] = useState<Record<number, string | null>>({});

  useEffect(() => {
    fetch("/api/movies")
      .then((response) => response.json())
      .then((data) => setMovies(data.movies || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => setCurrent((index) => (index + 1) % movies.length), 7000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const movie = movies[current];
  // Use separate images for desktop and mobile
  const desktopImage = movie?.desktopBgUrl || movie?.posterUrl;
  const mobileImage = movie?.mobileBgUrl || movie?.desktopBgUrl || movie?.posterUrl;
  const activeTime = movie && selectedTimes[movie.id];

  return (
    <section id="now-showing" className="relative overflow-hidden bg-gradient-to-b from-[#0a0806] via-[#0f0c09] to-[#0a0806]">
      {/* Mobile: Full Background Image */}
      {movie && mobileImage && (
        <div className="absolute inset-0 md:hidden">
          <Image
            key={`mobile-bg-${mobileImage}`}
            src={mobileImage}
            alt={movie.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
        </div>
      )}

      {/* Background Pattern - Desktop Only */}
      <div className="absolute inset-0 hidden opacity-[0.03] md:block" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-gold sm:text-xs">Cinema Experience</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl font-bold text-white sm:mt-4 sm:text-5xl lg:text-6xl xl:text-7xl">
            Now Showing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 sm:mt-4 sm:text-base lg:text-lg">
            Experience the magic of cinema with crystal-clear 4K projection and Dolby Atmos sound
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-800 border-t-gold" />
              <p className="mt-4 text-gray-400">Loading movies...</p>
            </div>
          </div>
        ) : !movie ? (
          <div className="rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-900/30 px-6 py-24 text-center backdrop-blur-sm">
            <div className="text-6xl">🎬</div>
            <p className="mt-4 text-xl text-gray-400">No movies currently showing</p>
            <p className="mt-2 text-sm text-gray-500">Check back soon for upcoming releases</p>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop: Card with Background Image */}
            <div className="hidden md:block">
              <div className="relative h-[600px] overflow-hidden rounded-2xl bg-black">
                {/* Desktop Background Image */}
                {desktopImage && (
                  <Image
                    key={`desktop-${desktopImage}`}
                    src={desktopImage}
                    alt={movie.title}
                    width={1920}
                    height={600}
                    priority
                    className="h-full w-full object-cover"
                    sizes="100vw"
                  />
                )}
                
                {/* Fallback Gradient */}
                {!desktopImage && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-gray-900 to-black" />
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

                {/* Content Container */}
                <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-6 pb-12 lg:px-8">
                  {/* Top Section: Badges */}
                  <div className="absolute left-6 top-6 lg:left-8 lg:top-8">
                    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-2 backdrop-blur-md">
                      <Image src="/4k.png" alt="4K" width={32} height={32} className="h-6 w-auto" />
                      <Image src="/dolby.png" alt="Dolby Atmos" width={64} height={32} className="h-6 w-auto" />
                    </div>
                  </div>

                  {/* Bottom Section: Movie Info */}
                  <div className="space-y-4">
                    {/* Featured Badge */}
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gold/20 px-4 py-1.5 backdrop-blur-md">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold"></span>
                      </span>
                      <span className="text-sm font-bold uppercase tracking-wider text-gold">
                        Featured Film
                      </span>
                    </div>

                    {/* Movie Title - Single Line with Truncate */}
                    <h3 className="truncate font-[family-name:var(--font-cormorant)] text-6xl font-bold text-white lg:text-7xl">
                      {movie.title}
                    </h3>

                    {/* Movie Info Pills */}
                    <div className="flex flex-wrap gap-2">
                      {movie.certification && (
                        <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                          {movie.certification}
                        </span>
                      )}
                      {movie.language && (
                        <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                          {movie.language}
                        </span>
                      )}
                      {movie.dimension && (
                        <span className="rounded-full border border-white/20 bg-black/60 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                          {movie.dimension}
                        </span>
                      )}
                    </div>

                    {/* Showtimes */}
                    {movie.showtimes.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-bold uppercase tracking-wider text-gray-300">
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
                                className={`relative overflow-hidden rounded-lg border px-5 py-2.5 text-base font-bold backdrop-blur-sm transition-all duration-300 ${
                                  active
                                    ? "border-gold bg-gold text-black shadow-lg shadow-gold/30"
                                    : "border-white/30 bg-black/60 text-white hover:border-gold hover:bg-gold hover:text-black"
                                }`}
                              >
                                {to12h(showtime.time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Book Tickets Button */}
                    <div className="pt-2">
                      <Link
                        href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-gold/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-gold/40"
                      >
                        <span>Book Tickets</span>
                        <svg
                          className="h-5 w-5 transition-transform group-hover/btn:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Full-Screen Background */}
            <div className="md:hidden">
              <div className="space-y-6">
                {/* 4K Dolby Badge */}
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/70 px-3 py-2 backdrop-blur-md w-fit">
                  <Image src="/4k.png" alt="4K" width={32} height={32} className="h-5 w-auto" />
                  <Image src="/dolby.png" alt="Dolby Atmos" width={64} height={32} className="h-5 w-auto" />
                </div>

                {/* Featured Badge */}
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gold">
                    Featured Film
                  </span>
                </div>

                {/* Movie Title - Single Line with Truncate */}
                <h3 className="truncate font-[family-name:var(--font-cormorant)] text-4xl font-bold text-white sm:text-5xl">
                  {movie.title}
                </h3>

                {/* Movie Info Pills */}
                <div className="flex flex-wrap gap-2">
                  {movie.certification && (
                    <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {movie.certification}
                    </span>
                  )}
                  {movie.language && (
                    <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {movie.language}
                    </span>
                  )}
                  {movie.dimension && (
                    <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {movie.dimension}
                    </span>
                  )}
                </div>

                {/* Showtimes */}
                {movie.showtimes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
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
                            className={`relative overflow-hidden rounded-lg border px-4 py-2 text-sm font-bold backdrop-blur-sm transition-all duration-300 ${
                              active
                                ? "border-gold bg-gold text-black shadow-lg shadow-gold/30"
                                : "border-white/30 bg-black/60 text-white hover:border-gold hover:bg-gold hover:text-black"
                            }`}
                          >
                            {to12h(showtime.time)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Book Tickets Button */}
                <div>
                  <Link
                    href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-lg shadow-gold/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-gold/40"
                  >
                    <span>Book Tickets</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover/btn:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Movie Navigation */}
            {movies.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrent((index) => (index - 1 + movies.length) % movies.length)
                  }
                  aria-label="Previous movie"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800/80 text-xl text-gray-300 backdrop-blur-sm transition-all hover:border-gold hover:bg-gray-800 hover:text-gold"
                >
                  ←
                </button>

                {/* Dots Indicator */}
                <div className="flex items-center gap-2">
                  {movies.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrent(index)}
                      aria-label={`Show ${item.title}`}
                      aria-current={index === current ? "true" : undefined}
                      className="group/dot p-2"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          index === current
                            ? "h-2.5 w-8 bg-gold"
                            : "h-2 w-2 bg-gray-600 group-hover/dot:bg-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrent((index) => (index + 1) % movies.length)}
                  aria-label="Next movie"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-gray-800/80 text-xl text-gray-300 backdrop-blur-sm transition-all hover:border-gold hover:bg-gray-800 hover:text-gold"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
