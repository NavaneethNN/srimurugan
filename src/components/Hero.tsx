import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-background pt-[68px]">
      <div className="pointer-events-none absolute -left-40 top-4 h-96 w-96 rounded-full bg-[#edd9b9]/50 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_35%,rgba(183,123,55,.12),transparent_60%)]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-68px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="section-label">Sri Murugan Cinema · Since 1971</p>
          <h1 className="mt-5 font-[family-name:var(--font-cormorant)] text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[.9] tracking-tight text-foreground">
            Every film<br />
            <span className="italic text-gold">deserves</span> a<br />
            grand screen.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted sm:text-lg">
            Feel the story come alive with stunning 4K projection, Dolby Atmos sound, and a cinema experience made for Coimbatore.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold min-h-12 justify-center"
            >
              Book Tickets <span aria-hidden="true">↗</span>
            </Link>
            <a href="#now-showing" className="inline-flex min-h-12 items-center rounded border border-surface-border px-6 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold">
              Explore what’s on <span className="ml-2" aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-surface-border pt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:mt-12">
            <span><strong className="mr-2 text-gold">4K</strong> Barco Laser</span>
            <span><strong className="mr-2 text-gold">64</strong> Channel Atmos</span>
            <span><strong className="mr-2 text-gold">1971</strong> Established</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] lg:max-w-none">
          <div className="absolute -bottom-5 -right-4 h-full w-full rounded-[2rem] border border-gold/25 bg-[#e9d7b9] sm:-bottom-7 sm:-right-7" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#21170e] shadow-[0_30px_70px_rgba(56,35,14,.2)] sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image src="/hero-cinema.png" alt="Auditorium at Sri Murugan Cinema" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#efd7a5]">The big screen awaits</p>
                <p className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl font-semibold sm:text-4xl">See you at the movies.</p>
              </div>
              <span className="hidden rounded-full border border-white/60 px-3 py-2 text-xs font-semibold sm:block">Coimbatore</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
