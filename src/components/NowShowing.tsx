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
  const image = movie?.desktopBgUrl || movie?.mobileBgUrl || movie?.posterUrl;
  const activeTime = movie && selectedTimes[movie.id];

  return (
    <section id="now-showing" className="bg-surface py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">On the big screen</p>
            <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl font-semibold text-foreground sm:text-6xl">Now Showing</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted">Find your next story, pick a showtime, and make a night of it.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-card-border bg-card px-6 py-24 text-center text-muted">Loading movies…</div>
        ) : !movie ? (
          <div className="rounded-3xl border border-card-border bg-card px-6 py-24 text-center text-muted">No movies currently showing.</div>
        ) : (
          <div className="grid overflow-hidden rounded-[2rem] border border-card-border bg-card shadow-[0_24px_70px_rgba(69,48,24,.09)] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative min-h-[360px] bg-[#281b16] sm:min-h-[480px] lg:min-h-[570px]">
              {image ? (
                <Image key={image} src={image} alt={movie.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#704928] via-[#322117] to-[#18120d]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/40 bg-black/50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[.08em] text-white backdrop-blur-sm sm:bottom-8 sm:left-8 sm:translate-x-0 sm:text-xs sm:tracking-[.16em]">
                <span className="sm:hidden">Playing at Sri Murugan</span>
                <span className="hidden sm:inline">Playing at Sri Murugan Cinema</span>
              </div>
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Featured film</p>
              <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">{movie.title}</h3>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {movie.certification && <span className="rounded-full border border-surface-border px-3 py-1.5">{movie.certification}</span>}
                {movie.language && <span className="rounded-full border border-surface-border px-3 py-1.5">{movie.language}</span>}
                {movie.dimension && <span className="rounded-full border border-surface-border px-3 py-1.5">{movie.dimension}</span>}
              </div>
              {movie.showtimes.length > 0 && (
                <div className="mt-10">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-muted">Showtimes</p>
                  <div className="overflow-x-auto pb-1">
                    <div
                      className={`grid w-full gap-2 ${movie.showtimes.length > 4 ? "max-w-[400px]" : "max-w-[280px]"}`}
                      style={{ gridTemplateColumns: `repeat(${Math.ceil(movie.showtimes.length / 2)}, minmax(4.25rem, 1fr))` }}
                    >
                      {movie.showtimes.map((showtime) => {
                        const active = activeTime === showtime.time;
                        return (
                          <button
                            key={showtime.id}
                            type="button"
                            onClick={() => setSelectedTimes((previous) => ({ ...previous, [movie.id]: active ? null : showtime.time }))}
                            aria-pressed={active}
                            className={`min-h-11 whitespace-nowrap rounded-lg border py-2.5 font-semibold transition ${movie.showtimes.length > 4 ? "px-1 text-[0.7rem] sm:text-sm" : "px-2 text-sm"} ${active ? "border-gold bg-gold text-white" : "border-surface-border bg-surface text-foreground hover:border-gold hover:text-gold"}`}
                          >
                            {to12h(showtime.time)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <Link
                href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-10 min-h-12 w-full justify-center sm:w-fit"
              >
                Book Tickets <span aria-hidden="true">↗</span>
              </Link>
              {movies.length > 1 && (
                <div className="mt-10 flex items-center gap-3 border-t border-surface-border pt-6">
                  <button type="button" onClick={() => setCurrent((index) => (index - 1 + movies.length) % movies.length)} aria-label="Previous movie" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surface-border text-foreground transition hover:border-gold hover:text-gold">←</button>
                  <div className="flex min-w-0 flex-1 flex-wrap justify-center" aria-label="Movie slides">
                    {movies.map((item, index) => (
                      <button key={item.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show ${item.title}`} aria-current={index === current ? "true" : undefined} className="flex h-10 w-10 items-center justify-center"><span className={`h-2 rounded-full transition-all ${index === current ? "w-7 bg-gold" : "w-2 bg-[#d8c9b4]"}`} /></button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setCurrent((index) => (index + 1) % movies.length)} aria-label="Next movie" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surface-border text-foreground transition hover:border-gold hover:text-gold">→</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
