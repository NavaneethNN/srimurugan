"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSectionNav, navigateToSectionFromPath } from "@/lib/sectionNav";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { handleNav } = useSectionNav();

  const [cartCount,  setCartCount]  = useState(0);

  /* listen for cart updates */
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("srimurugan-food-cart-v2") || "{}");
        const total = Object.values(saved).reduce((sum: number, q) => sum + (typeof q === "number" ? q : 0), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("srimurugan-cart-updated", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("srimurugan-cart-updated", updateCartCount);
    };
  }, []);

  /* scroll-aware background */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* lock body scroll when drawer is open */
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();

    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>("#mobile-menu button, #mobile-menu a"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1280) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
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
          ? "border-b border-[#222018] bg-[#080808]/95 shadow-[0_1px_18px_rgba(0,0,0,0.2)] backdrop-blur-md"
          : "border-b border-[#222018] bg-[#080808]/95 backdrop-blur-md"
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
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;
            if (link.href === "/order-food") {
              return (
                <Link
                  key={link.label}
                  href="/order-food"
                  prefetch={true}
                  className={`relative px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                    isActive ? "text-gold" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gold" />
                  )}
                </Link>
              );
            }
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
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
        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/order-food"
            className="group flex items-center gap-2 rounded border border-gold/50 bg-gold/15 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gold transition-all duration-200 hover:bg-gold hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
              <path d="M15 2v19" />
              <path d="M6 2v7a3 3 0 0 0 6 0V2" />
              <path d="M9 2v19" />
            </svg>
            <span>Order Snacks</span>
            {cartCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1.5 text-[0.62rem] font-black text-white group-hover:bg-white group-hover:text-gold">
                {cartCount}
              </span>
            )}
          </Link>
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

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/order-food"
            className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
              <path d="M15 2v19" />
              <path d="M6 2v7a3 3 0 0 0 6 0V2" />
              <path d="M9 2v19" />
            </svg>
            <span>Food</span>
            {cartCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-black text-white">
                {cartCount}
              </span>
            )}
          </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded text-white/80 transition-colors hover:text-gold xl:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
          </svg>
        </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && typeof document !== "undefined" && createPortal(<div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Main menu" className="fixed inset-0 z-[100] flex h-dvh flex-col bg-[#080808] text-white xl:hidden">
        {/* top bar */}
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#28251f] px-4 sm:px-6">
          <Image src="/logo.png" alt="Sri Murugan Cinema" width={110} height={110} className="h-[56px] w-auto object-contain" />
          <button ref={closeButtonRef} type="button" onClick={() => { setOpen(false); menuButtonRef.current?.focus(); }} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="M6 6 18 18" /></svg>
          </button>
        </div>

        {/* nav links */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6" aria-label="Mobile navigation">
          {navLinks.map((link) => {
            const isActive = activeHref === link.href;
            if (link.href === "/order-food") {
              return (
                <Link
                  key={link.label}
                  href="/order-food"
                  prefetch={true}
                  onClick={() => setOpen(false)}
                  className={`group flex min-h-12 w-full items-center gap-3 rounded px-3 py-3 text-base font-semibold uppercase tracking-[0.12em] transition-colors sm:text-lg ${
                    isActive
                      ? "text-gold"
                      : "text-white/80 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span className={`h-4 w-0.5 shrink-0 rounded-full ${isActive ? "bg-gold" : "bg-transparent"}`} />
                  <span className="flex-1">{link.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-bold text-gold">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                      <path d="M15 2v19" />
                      <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                      <path d="M9 2v19" />
                    </svg>
                    <span>Seat Delivery</span>
                  </span>
                </Link>
              );
            }
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`group flex min-h-12 w-full items-center gap-3 rounded px-3 py-3 text-base font-semibold uppercase tracking-[0.12em] transition-colors sm:text-lg ${
                  isActive
                    ? "text-gold"
                    : "text-white/80 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <span className={`h-4 w-0.5 shrink-0 rounded-full ${isActive ? "bg-gold" : "bg-transparent"}`} />
                <span className="flex-1">{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* mobile CTA */}
        <div className="shrink-0 border-t border-[#28251f] px-4 py-4 sm:px-6" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <Link
            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="btn-gold min-h-12 w-full justify-center"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <path d="M6 7v10M18 7v10" />
            </svg>
            Book Tickets
          </Link>
        </div>
      </div>, document.body)}
    </header>
  );
}
