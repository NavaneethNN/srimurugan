"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSectionNav, navigateToSectionFromPath } from "@/lib/sectionNav";

const navLinks = [
  { label: "HOME", href: "/home" },
  { label: "NOW SHOWING", href: "/now-showing" },
  { label: "COMING SOON", href: "/coming-soon" },
  { label: "FEATURES", href: "/features" },
  { label: "ABOUT US", href: "/about" },
  { label: "GALLERY", href: "/gallery" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { handleNav } = useSectionNav();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onPopState = () => {
      navigateToSectionFromPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-card-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="relative z-50 flex items-center">
          <Image
            src="/logo.png"
            alt="Sri Murugan Cinema"
            width={120}
            height={120}
            className="h-[70px] w-auto sm:h-[70px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNav(e, link.href)}
              className="text-xs font-medium tracking-wider text-white/80 transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded bg-gold px-4 py-2 text-xs font-semibold text-background transition-all hover:scale-105 hover:bg-gold-dark sm:inline-flex"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <path d="M6 7v10M18 7v10" />
              <path d="M9 10h.01M15 10h.01" />
            </svg>
            BOOK TICKETS
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="relative z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-black/0 bg-black/5 p-2 text-white backdrop-blur-sm transition-colors  hover:text-gold lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              className="h-10 w-10 transition-transform duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* full-screen mobile menu */}
      <div
        className={`fixed inset-0 z-50 h-dvh w-full bg-[#0a0a0a] transition-all duration-300 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* solid backing layer, guarantees no see-through even if the
            theme variable ever renders transparent */}
        <div className="absolute inset-0 bg-background" />

        <div className="relative flex h-full flex-col">
          {/* top row mirrors header height so the close button lines up
              with the hamburger button above */}
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Image
              src="/logo.png"
              alt="Sri Murugan Cinema"
              width={120}
              height={120}
              className="h-[70px] w-auto"
            />
          </div>

          <div className="mx-4 h-px bg-white/10 sm:mx-6" />

          <nav className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-8">
            {navLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  handleNav(e, link.href);
                  setOpen(false);
                }}
                className="group flex w-full items-center justify-center gap-3 py-4 text-center text-2xl font-bold uppercase tracking-widest text-white transition-all duration-300"
                style={{
                  transitionDelay: open ? `${index * 40}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <span className="transition-colors duration-200 group-hover:text-gold group-active:text-gold">
                  {link.label}
                </span>
              </a>
            ))}

            <Link
              href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded bg-gold px-8 py-3.5 text-sm font-semibold text-background transition-transform active:scale-95"
              style={{
                transitionDelay: open ? `${navLinks.length * 40}ms` : "0ms",
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(10px)",
              }}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="10" rx="2" />
                <path d="M6 7v10M18 7v10" />
                <path d="M9 10h.01M15 10h.01" />
              </svg>
              BOOK TICKETS
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}