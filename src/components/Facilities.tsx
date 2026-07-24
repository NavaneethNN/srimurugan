import Reveal from "@/components/Reveal";

const features = [
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M8 8a8 8 0 0 0 8 0" />
        <path d="M8 16a8 8 0 0 1 8 0" />
      </svg>
    ),
    title: "FULLY",
    subtitle: "AIR-CONDITIONED",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
    title: "PUSH BACK",
    subtitle: "SEATING",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 20h8" />
        <path d="M6 20v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
        <path d="M12 2v6" />
        <path d="M9 8h6" />
        <path d="M7 16h10" />
      </svg>
    ),
    title: "FOOD",
    subtitle: "COURT",
  },
  {
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
        <path d="M17 17H9a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z" />
        <circle cx="7" cy="7" r="3" />
      </svg>
    ),
    title: "AMPLE PARKING",
    subtitle: "TWO-WHEELERS & CARS",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-y border-card-border bg-card/30 py-12 sm:py-16">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">OUR FEATURES</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-xl border border-card-border bg-card p-5 text-center transition-transform hover:-translate-y-1 sm:p-6"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold tracking-wide text-white sm:text-base">
                {feature.title}
              </h3>
              <p className="mt-1 text-[0.65rem] tracking-wider text-muted sm:text-xs">
                {feature.subtitle}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
