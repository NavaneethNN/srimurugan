"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useSectionNav } from "@/lib/sectionNav";

const quickLinks = [
  { label: "Home",        href: "/home" },
  { label: "Now Showing", href: "/now-showing" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "Features",    href: "/features" },
  { label: "Order Food",  href: "/order-food" },
  { label: "About Us",    href: "/about" },
  { label: "Gallery",     href: "/gallery" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { handleNav } = useSectionNav();

  return (
    <footer id="contact" className="border-t border-card-border bg-card">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Top band ── */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-card-border py-10 sm:flex-row sm:items-center sm:py-12">
          <div className="rounded-xl bg-[#080808] px-3 py-1">
            <Image
              src="/logo.png"
              alt="Sri Murugan Cinema"
              width={130}
              height={130}
              className="h-[62px] w-auto object-contain"
            />
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Book your next show</p>
            <Link
              href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="10" rx="2" />
                <path d="M6 7v10M18 7v10" />
              </svg>
              Book Tickets
            </Link>
          </div>
        </div>

        {/* ── Column grid ── */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* Location */}
          <div>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Location</p>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Mettupalayam Road</p>
                <p className="mt-0.5 text-sm text-muted">Coimbatore, Tamil Nadu</p>
                <p className="text-sm text-muted">641 043</p>
              </div>
            </div>
          </div>

          {/* Show Timings */}
          <div>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Show Timings</p>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Daily Shows</p>
                <p className="mt-0.5 text-sm text-muted">10:00 AM – 10:00 PM</p>
                <p className="mt-1 text-[0.7rem] text-muted">All days of the week</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Quick Links</p>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={link.href === "/order-food" ? undefined : (e) => handleNav(e, link.href)}
                    className="text-sm text-muted transition-colors duration-150 hover:text-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Follow Us</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-background text-muted transition-all duration-200 hover:border-gold/40 hover:text-gold"
                >
                  {s.icon}
                </a>
              ))}
            </div>
            <p className="mt-6 text-[0.7rem] leading-relaxed text-muted">
              Stay up to date with the latest releases and offers.
            </p>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-card-border py-6 sm:flex-row">
          <p className="text-[0.7rem] text-muted">
            © {new Date().getFullYear()} Sri Murugan Cinema. All Rights Reserved.
          </p>
          <nav aria-label="Customer policies" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted">
            <Link href="/terms-and-conditions" className="hover:text-gold">Terms and Conditions</Link>
            <Link href="/cancellation-policy" className="hover:text-gold">Cancellation Policy</Link>
            <Link href="/refund-policy" className="hover:text-gold">Refund Policy</Link>
          </nav>
        </div>
      </Reveal>
    </footer>
  );
}
