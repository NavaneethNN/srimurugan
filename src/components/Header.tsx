"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSectionNav, navigateToSectionFromPath } from "@/lib/sectionNav";

const navLinks = [
  { label: "Home",        href: "/home" },
  { label: "Now Showing", href: "/now-showing" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "Features",    href: "/features" },
  { label: "Order Food",  href: "/order-food" },
  { label: "About",       href: "/about" },
  { label: "Gallery",     href: "/gallery" },
  { label: "Contact",     href: "/contact" },
];

export default function Header() {
  const [open,       setOpen]       = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [activeHref, setActiveHref] = useState("");
  const { handleNav } = useSectionNav();

  /* scroll-aware background */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* deep-link restoration */
  useEffect(() => {
    const onPopState = () => navigateToSectionFromPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /* highlight active link based on section in viewport */
  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.href.replace("/", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveHref(`/${entry.target.id}`);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    handleNav(e as unknown as React.MouseEvent<HTMLAnchorElement> & MouseEvent, href);
    setActiveHref(href);
    setOpen(false);
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-card-border bg-background/95 shadow-[0_1px_18px_rgba(0,0,0,0.6)] backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent backdrop-blur-none"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="relative z-50 shrink-0">
          <Image
            src="/logo.png"
            alt="Sri Murugan Cinema"
            width={110}
            height={110}
            className="h-[60px] w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={link.href === "/order-food" ? () => setOpen(false) : (e) => handleNavClick(e, link.href)}
                className={`relative px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                  isActive ? "text-gold" : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gold" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center lg:flex">
          <Link
            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-[0.7rem]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <path d="M6 7v10M18 7v10" />
            </svg>
            Book Tickets
          </Link>
        </div>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="relative z-[60] flex h-10 w-10 items-center justify-center rounded text-white/80 transition-colors hover:text-gold lg:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h10" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-background transition-all duration-300 ease-in-out lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* top bar */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-card-border px-4 sm:px-6">
          <Image src="/logo.png" alt="Sri Murugan Cinema" width={110} height={110} className="h-[56px] w-auto object-contain" />
          {/* close button placeholder — handled by the hamburger above */}
        </div>

        {/* nav links */}
        <nav className="flex flex-1 flex-col items-start justify-center gap-0.5 overflow-y-auto px-6 py-6">
          {navLinks.map((link, i) => {
            const isActive = activeHref === link.href;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={link.href === "/order-food" ? () => setOpen(false) : (e) => handleNavClick(e, link.href)}
                className={`group flex w-full items-center gap-3 rounded px-3 py-4 text-lg font-semibold uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? "text-gold"
                    : "text-white/80 hover:bg-white/[0.03] hover:text-white"
                }`}
                style={{
                  transitionDelay: open ? `${i * 35}ms` : "0ms",
                  opacity:    open ? 1 : 0,
                  transform:  open ? "translateX(0)" : "translateX(-12px)",
                }}
              >
                {isActive && <span className="h-4 w-0.5 rounded-full bg-gold" />}
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* mobile CTA */}
        <div className="shrink-0 border-t border-card-border px-6 py-5">
          <Link
            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="btn-gold w-full justify-center"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <path d="M6 7v10M18 7v10" />
            </svg>
            Book Tickets
          </Link>
        </div>
      </div>
    </header>
  );
}
