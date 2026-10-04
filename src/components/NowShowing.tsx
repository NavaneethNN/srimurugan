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
  const desktopImage = movie?.desktopBgUrl || movie?.posterUrl;
  const mobileImage = movie?.mobileBgUrl || movie?.posterUrl;
  const activeTime = movie && selectedTimes[movie.id];

  return (
    <section id="now-showing" className="relative overflow-hidden bg-gradient-to-b from-[#0a0806] via-[#0f0c09] to-[#0a0806] py-16 sm:py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Cinema Experience</p>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
            Now Showing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
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
          <div className="group relative">
            {/* Main Movie Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-900/50 shadow-2xl backdrop-blur-sm transition-all duration-500 hover:shadow-gold/10">
              <div className="grid lg:grid-cols-[1.1fr_1fr]">
                {/* Movie Image */}
                <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/9] lg:aspect-auto lg:min-h-[600px]">
                  {/* Desktop Image */}
                  {desktopImage && (
                    <Image
                      key={`desktop-${desktopImage}`}
                      src={desktopImage}
                      alt={movie.title}
                      fill
                      priority
                      className="hidden object-cover transition-transform duration-700 group-hover:scale-105 sm:block"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  )}
                  {/* Mobile Image */}
                  {mobileImage && (
                    <Image
                      key={`mobile-${mobileImage}`}
                      src={mobileImage}
                      alt={movie.title}
                      fill
                      priority
                      className="block object-cover transition-transform duration-700 group-hover:scale-105 sm:hidden"
                      sizes="100vw"
                    />
                  )}
                  {/* Fallback Gradient */}
                  {!desktopImage && !mobileImage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-gray-900 to-black" />
                  )}
                  
                  {/* Overlay Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent lg:bg-gradient-to-r" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />

                  {/* 4K Dolby Badge */}
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-3 py-2 backdrop-blur-md sm:left-6 sm:top-6">
                    <div className="flex items-center gap-2">
                      <Image src="/4k.png" alt="4K" width={32} height={32} className="h-5 w-auto sm:h-6" />
                      <Image src="/dolby.png" alt="Dolby Atmos" width={64} height={32} className="h-5 w-auto sm:h-6" />
                    </div>
                  </div>

                  {/* Playing Badge - Mobile Only */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-gold/40 bg-black/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold backdrop-blur-md lg:hidden">
                    Now Playing
                  </div>
                </div>

                {/* Movie Details */}
                <div className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-14">
                  {/* Featured Badge */}
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-gold"></span>
                    </span>
                    Featured Film
                  </div>

                  {/* Movie Title */}
                  <h3 className="mt-6 font-[family-name:var(--font-cormorant)] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                    {movie.title}
                  </h3>

                  {/* Movie Info Pills */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {movie.certification && (
                      <span className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-1.5 text-sm font-semibold text-gray-300">
                        {movie.certification}
                      </span>
                    )}
                    {movie.language && (
                      <span className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-1.5 text-sm font-semibold text-gray-300">
                        {movie.language}
                      </span>
                    )}
                    {movie.dimension && (
                      <span className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-1.5 text-sm font-semibold text-gray-300">
                        {movie.dimension}
                      </span>
                    )}
                  </div>

                  {/* Showtimes */}
                  {movie.showtimes.length > 0 && (
                    <div className="mt-8">
                      <p className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
                        Select Showtime
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
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
                              className={`group/time relative overflow-hidden rounded-lg border px-3 py-3 text-center font-semibold transition-all duration-300 ${
                                active
                                  ? "border-gold bg-gold text-black shadow-lg shadow-gold/20"
                                  : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gold hover:bg-gray-800 hover:text-gold"
                              }`}
                            >
                              <span className="relative z-10 text-sm sm:text-base">
                                {to12h(showtime.time)}
                              </span>
                              {!active && (
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold/10 to-transparent transition-transform duration-500 group-hover/time:translate-x-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Book Tickets Button */}
                  <Link
                    href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-8 py-4 text-base font-bold uppercase tracking-wide text-black shadow-lg shadow-gold/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-gold/30 sm:w-auto"
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

                  {/* Movie Navigation */}
                  {movies.length > 1 && (
                    <div className="mt-10 flex items-center gap-4 border-t border-gray-800 pt-8">
                      {/* Previous Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setCurrent((index) => (index - 1 + movies.length) % movies.length)
                        }
                        aria-label="Previous movie"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-800/50 text-xl text-gray-300 transition-all hover:border-gold hover:bg-gray-800 hover:text-gold"
                      >
                        ←
                      </button>

                      {/* Dots Indicator */}
                      <div className="flex flex-1 items-center justify-center gap-2">
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
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-800/50 text-xl text-gray-300 transition-all hover:border-gold hover:bg-gray-800 hover:text-gold"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
