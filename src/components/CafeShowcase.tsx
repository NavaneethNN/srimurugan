"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

const highlights = [
  {
    title: "Fresh & Hot",
    desc: "Buttery popcorn, hot savouries, and oven-fresh puffs prepared with care.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  },
  {
    title: "Delivered to Seat",
    desc: "Tell us your screen & seat number — we'll bring your order straight to you.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2M19 18v2" />
      </svg>
    ),
  },
  {
    title: "Skip the Concession Queue",
    desc: "No rush during intervals. Relax in your push-back seat while we serve.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Instant UPI & Card Pay",
    desc: "100% contactless payment via Google Pay, PhonePe, Paytm, or debit/credit cards.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

const featuredDishes = [
  {
    name: "Classic Butter Popcorn",
    category: "Cinema Classic",
    price: "₹130",
    image: "/food/popcorn.jpg",
    tag: "Crowd favourite",
    isVeg: true,
  },
  {
    name: "Caramel Crunch Popcorn",
    category: "Sweet & Crunchy",
    price: "₹160",
    image: "/food/caramel-popcorn.jpg",
    tag: "Bestseller",
    isVeg: true,
  },
  {
    name: "Mexican Grilled Sandwich",
    category: "Savory Snack",
    price: "₹120",
    image: "/food/sandwich.jpg",
    tag: "Chef's Special",
    isVeg: true,
  },
  {
    name: "Brewed Cold Coffee",
    category: "Chilled Refreshment",
    price: "₹90",
    image: "/food/cold-coffee.jpg",
    tag: "Refreshing",
    isVeg: true,
  },
];

export default function CafeShowcase() {
  return (
    <section id="cafe-showcase" className="relative overflow-hidden bg-[#faf6ef] py-20 sm:py-24 lg:py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-gold/10 blur-[100px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[380px] w-[380px] rounded-full bg-gold/8 blur-[90px]" />

      <Reveal className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Cinema Dining · Sri Murugan Cafe</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Sip, Snack & Enjoy. <br />
            <span className="italic text-gold">Delivered Straight to Your Seat.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Don&apos;t miss a single scene waiting in the intermission crowd. Choose your film-time snacks, pay online with UPI or Card, and we&apos;ll bring them right to your seat in Screen 1 or Screen 2.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/order-food"
              className="btn-gold min-h-12 shadow-[0_8px_25px_rgba(201,153,58,0.3)] transition-transform hover:scale-105"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Order Food to Your Seat
            </Link>
            <Link
              href="/order-food"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-surface-border bg-card px-6 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-gold hover:text-gold"
            >
              Browse Full Menu (25 Items) →
            </Link>
          </div>
        </div>

        {/* 4 Feature Pills */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="pro-card flex items-start gap-3.5 rounded-2xl bg-card p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                {h.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{h.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Snack Cards */}
        <div className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Crowd Favourites</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">Most Loved at Sri Murugan</h3>
            </div>
            <Link
              href="/order-food"
              className="text-xs font-bold text-gold transition hover:underline"
            >
              View all 25 snacks & beverages →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDishes.map((item, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-card shadow-[0_10px_30px_rgba(56,35,14,.06)] transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_16px_40px_rgba(56,35,14,.12)]"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#201810]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Veg indicator & Tag */}
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border bg-white shadow-sm ${
                        item.isVeg ? "border-emerald-600" : "border-red-600"
                      }`}
                      title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          item.isVeg ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                    </span>
                    <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-white backdrop-blur-sm">
                      {item.tag}
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 rounded-lg bg-gold px-2.5 py-1 text-xs font-black text-white shadow-md">
                    {item.price}
                  </span>
                </div>

                {/* Details & CTA */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">{item.category}</p>
                    <h4 className="mt-1 text-base font-bold text-foreground group-hover:text-gold transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border">
                    <Link
                      href="/order-food"
                      className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/10 text-xs font-bold text-gold transition-all duration-200 group-hover:bg-gold group-hover:text-white"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                        <path d="M15 2v19" />
                        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                        <path d="M9 2v19" />
                      </svg>
                      <span>Order to Seat</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick order banner */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-r from-[#201810] via-[#2c2217] to-[#1c140d] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-gold-light">
                <svg className="h-3.5 w-3.5 text-gold-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Interval or Pre-Show Dining</span>
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-semibold sm:text-3xl">
                Already seated in Screen 1 or Screen 2?
              </h3>
              <p className="mt-1.5 text-xs text-amber-100/90 sm:text-sm">
                Open the online menu on your phone, pick your screen and seat, and your order will arrive hot and fresh at your seat within 15–20 minutes.
              </p>
            </div>
            <Link
              href="/order-food"
              className="btn-gold shrink-0 px-6 py-3.5 text-xs tracking-wider"
            >
              Order Now to Seat →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

