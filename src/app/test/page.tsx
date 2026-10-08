import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Test Suite",
  description: "Internal manual test tracker for Sri Murugan Cinema features.",
};

const testSuites = [
  {
    href: "/test/food",
    label: "Food Ordering",
    description: "Menu loading, cart, checkout, payment, verification and order editing.",
    count: 37,
    icon: "🍿",
  },
];

export default function TestIndexPage() {
  return (
    <div className="site-light flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-[68px]">
        {/* Hero strip */}
        <section className="border-b border-[var(--card-border)] py-14 px-4 text-center">
          <p className="section-label mx-auto mb-4">Internal</p>
          <h1 className="section-title">Test Suite</h1>
          <p className="mt-4 max-w-xl mx-auto text-[var(--muted)] text-sm leading-relaxed">
            Pick a feature area below to run through manual test cases, mark them pass / fail, and add notes.
            Results are saved in your browser's local storage.
          </p>
        </section>

        {/* Cards */}
        <section className="max-w-4xl mx-auto px-4 py-12 grid sm:grid-cols-2 gap-6">
          {testSuites.map((suite) => (
            <Link
              key={suite.href}
              href={suite.href}
              className="group block rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--gold)] hover:shadow-[0_0_24px_rgba(201,153,58,0.12)]"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl leading-none">{suite.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-[var(--gold)] transition-colors">
                      {suite.label}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--card-border)] text-[var(--muted)]">
                      {suite.count} cases
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{suite.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
                    Open suite
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
