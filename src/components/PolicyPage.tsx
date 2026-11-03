import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Section = { title: string; content: ReactNode };

export default function PolicyPage({
  title,
  introduction,
  sections,
}: {
  title: string;
  introduction: string;
  sections: Section[];
}) {
  return (
    <div className="site-light flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-surface px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl">
          <Link href="/order-food" className="text-sm font-semibold text-gold hover:text-gold">
            ← Back to food orders
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-gold">Sri Murugan Cinema · Customer policies</p>
          <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground break-words">
            {title}
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed sm:leading-7 text-muted">{introduction}</p>
          <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-gold/20 bg-card p-5 shadow-[0_14px_35px_rgba(60,39,21,.05)] sm:p-8">
                <h2 className="text-base sm:text-lg font-semibold text-gold">{section.title}</h2>
                <div className="mt-2.5 sm:mt-3 text-sm leading-relaxed sm:leading-7 text-muted sm:text-base">{section.content}</div>
              </section>
            ))}
          </div>
          <p className="mt-8 text-sm leading-6 text-muted">
            These policies apply to food and beverage orders with Sri Murugan Cinema. Ticket bookings made through third-party platforms are subject to that platform’s terms.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
