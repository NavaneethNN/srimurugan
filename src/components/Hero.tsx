import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-[#faf6ef] pt-[68px]">
      <div className="mx-auto grid min-h-[calc(100svh-68px)] max-w-7xl items-center gap-10 px-5 py-10 sm:px-6 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="whitespace-nowrap text-[0.62rem] font-bold uppercase tracking-[0.13em] text-gold sm:text-xs sm:tracking-[0.2em]">Sri Murugan Cinema · Since 1971</p>
          <h1 className="mt-5 font-[family-name:var(--font-cormorant)] text-[clamp(2.45rem,10vw,3.75rem)] font-semibold leading-[.98] tracking-tight text-foreground lg:text-[clamp(4.25rem,6.2vw,7rem)]">
            <span className="block whitespace-nowrap">Every film</span>
            <span className="block whitespace-nowrap"><span className="italic text-gold">deserves</span> a</span>
            <span className="block whitespace-nowrap">grand screen.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[0.95rem] leading-7 text-muted sm:mt-6 sm:text-lg sm:leading-8">
            Feel the story come alive with stunning 4K projection, Dolby Atmos sound, and a cinema experience made for Coimbatore.
          </p>
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold min-h-12 w-full justify-center sm:w-auto"
            >
              Book Tickets <span aria-hidden="true">↗</span>
            </Link>
            <a href="#now-showing" className="inline-flex min-h-12 w-full items-center justify-center rounded border border-surface-border px-6 text-center text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold sm:w-auto">
              Explore what’s on <span className="ml-2" aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-surface-border pt-5 text-center text-[0.65rem] font-semibold uppercase leading-4 tracking-[0.04em] text-muted sm:mt-12 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3 sm:pt-6 sm:text-left sm:text-xs sm:tracking-[0.14em]">
            <span><strong className="block text-base text-gold sm:mr-2 sm:inline sm:text-xs">4K</strong> Barco Laser</span>
            <span><strong className="block text-base text-gold sm:mr-2 sm:inline sm:text-xs">64</strong> Channel Atmos</span>
            <span><strong className="block text-base text-gold sm:mr-2 sm:inline sm:text-xs">1971</strong> Established</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] lg:max-w-none">
          <div className="absolute -bottom-5 -right-4 h-full w-full rounded-[2rem] border border-gold/25 bg-[#e9d7b9] sm:-bottom-7 sm:-right-7" />
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-[#21170e] shadow-[0_30px_70px_rgba(56,35,14,.2)] lg:aspect-[4/5]">
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
