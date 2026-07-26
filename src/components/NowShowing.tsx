"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import AOS from "aos";
import "aos/dist/aos.css";

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
  "from-amber-950 to-stone-950",
  "from-yellow-950 to-neutral-950",
  "from-emerald-950 to-stone-950",
  "from-red-950 to-purple-950",
  "from-cyan-950 to-blue-950",
  "from-orange-950 to-red-950",
];

function to12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function NowShowing() {
  const [movies,        setMovies]        = useState<Movie[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [current,       setCurrent]       = useState(0);
  const [selectedTimes, setSelectedTimes] = useState<Record<number, string | null>>({});

  useEffect(() => {
    fetch("/api/movies")
      .then((r) => r.json())
      .then((d) => setMovies(d.movies || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    AOS.init({ duration: 650, easing: "ease-out-cubic", once: false, offset: 80 });
  }, []);

  useEffect(() => { AOS.refresh(); }, [current]);

  /* auto-advance */
  useEffect(() => {
    if (movies.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % movies.length), 7000);
    return () => clearInterval(id);
  }, [movies.length]);

  if (loading) return (
    <section id="now-showing" className="flex min-h-[60vh] items-center justify-center bg-background">
      <p className="text-white/40 text-sm tracking-wider">Loading…</p>
    </section>
  );

  if (movies.length === 0) return (
    <section id="now-showing" className="flex min-h-[60vh] items-center justify-center bg-background">
      <p className="text-white/40 text-sm tracking-wider">No movies currently showing.</p>
    </section>
  );

  const movie    = movies[current];
  const activeT  = selectedTimes[movie.id];

  return (
    <section id="now-showing" className="relative min-h-screen overflow-hidden">

      {/* ── Background slides ── */}
      {movies.map((m, i) => (
        <div
          key={m.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          {m.posterUrl ? (
            <Image src={m.posterUrl} alt={m.title} fill priority={i === current} className="object-cover" sizes="100vw" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[i % gradients.length]}`} />
          )}
          {/* graduated overlays */}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      ))}

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-4 pb-14 pt-24 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">

        {/* section label */}
        <Reveal direction="up">
          <p className="section-label mb-6" data-aos="fade-up" data-aos-duration="500">
            Now Showing
          </p>

          <div className="max-w-2xl">
            {/* Meta row */}
            <div className="mb-3 flex flex-wrap items-center gap-2" data-aos="fade-up" data-aos-duration="550">
              {movie.certification && (
                <span className="rounded border border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  {movie.certification}
                </span>
              )}
              {movie.language && (
                <span className="text-[0.72rem] font-medium text-white/65 uppercase tracking-wider">
                  {movie.language}{movie.dimension ? ` · ${movie.dimension}` : ""}
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              key={`title-${movie.id}`}
              className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-7xl"
              data-aos="fade-up"
              data-aos-delay="80"
              data-aos-duration="650"
            >
              {movie.title}
            </h2>

            {/* Showtimes */}
            {movie.showtimes.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2" data-aos="fade-up" data-aos-delay="160" data-aos-duration="550">
                <span className="mr-1 text-[0.65rem] font-semibold tracking-[0.15em] uppercase text-white/40">
                  Showtimes
                </span>
                {movie.showtimes.map((s) => {
                  const active = activeT === s.time;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setSelectedTimes((prev) => ({
                          ...prev,
                          [movie.id]: active ? null : s.time,
                        }))
                      }
                      className={`rounded px-4 py-2 text-[0.72rem] font-semibold tracking-wide transition-all duration-200 ${
                        active
                          ? "bg-gold text-[#0a0805] shadow-[0_0_12px_rgba(201,153,58,0.4)]"
                          : "border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-sm hover:border-gold/50 hover:text-white"
                      }`}
                    >
                      {to12h(s.time)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="mt-7" data-aos="fade-up" data-aos-delay="240" data-aos-duration="550">
              <Link
                href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
              >
                Book Tickets
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Carousel controls ── */}
          {movies.length > 1 && (
            <div className="mt-10 flex items-center gap-3" data-aos="fade-up" data-aos-delay="300" data-aos-duration="500">
              <button
                type="button"
                onClick={() => setCurrent((c) => (c - 1 + movies.length) % movies.length)}
                aria-label="Previous movie"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/60 backdrop-blur-sm transition hover:border-gold/50 hover:text-gold"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-1.5">
                {movies.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to movie ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? "h-2 w-6 bg-gold"
                        : "h-1.5 w-1.5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrent((c) => (c + 1) % movies.length)}
                aria-label="Next movie"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/60 backdrop-blur-sm transition hover:border-gold/50 hover:text-gold"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </Reveal>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-0 z-10 w-full"><hr className="gold-rule" /></div>
    </section>
  );
}
