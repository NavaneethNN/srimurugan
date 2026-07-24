"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useSectionNav } from "@/lib/sectionNav";

const quickLinks = [
  { label: "Home", href: "/home" },
  { label: "Now Showing", href: "/now-showing" },
  { label: "Coming Soon", href: "/coming-soon" },
  { label: "Features", href: "/features" },
  { label: "About Us", href: "/about" },
];

const socialLinks = [
  {
    label: "Facebook",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { handleNav } = useSectionNav();

  return (
    <footer id="contact" className="border-t border-card-border bg-card">
      <Reveal className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex justify-start">
          <Image
            src="/logo.png"
            alt="Sri Murugan Cinema"
            width={160}
            height={160}
            className="h-16 w-auto sm:h-20"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 text-left sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-white">LOCATION</p>
            <div className="flex flex-row items-start gap-3">
              <div className="mt-0 text-gold sm:mt-1">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Mettupalayam Road,</p>
                <p className="text-sm text-muted">Coimbatore, Tamil Nadu - 641 043</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-white">SHOW TIMINGS</p>
            <div className="flex flex-row items-start gap-3">
              <div className="text-gold sm:mt-1">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Daily Shows</p>
                <p className="text-sm text-muted">10:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-white">QUICK LINKS</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left sm:block sm:space-y-2">
              {quickLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNav(e, link.href)}
                  className="block text-sm text-muted transition-colors hover:text-gold"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium text-white">FOLLOW US</p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="text-muted transition-all hover:scale-110 hover:text-gold"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-card-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted">
            © 2026 Sri Murugan Cinema. All Rights Reserved.
          </p>
          <Link
            href="https://in.bookmyshow.com/cinemas/COIM/murugan-cinemas-ac-4k-atmos-thudiyalur/buytickets/MCTC/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded bg-gold px-5 py-2.5 text-xs font-semibold text-background shadow-gold transition-all hover:scale-105 hover:bg-gold-dark"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <path d="M6 7v10M18 7v10" />
              <path d="M9 10h.01M15 10h.01" />
            </svg>
            BOOK TICKETS
          </Link>
        </div>
      </Reveal>
    </footer>
  );
}
