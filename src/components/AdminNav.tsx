"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const sections = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders Queue",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: "/admin/cafe",
    label: "Menu & Catalog",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
        <path d="M15 2v19" />
        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
        <path d="M9 2v19" />
      </svg>
    ),
  },
  {
    href: "/admin/cafe-users",
    label: "Staff & POS",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/movies",
    label: "Movies & Shows",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="15" x="2" y="7" rx="2" />
        <path d="m4 7 3-4h3l-3 4" />
        <path d="m11 7 3-4h3l-3 4" />
      </svg>
    ),
  },
];

export default function AdminNav({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not sign out. Please retry.");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please retry.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#222018] bg-[#080808]/95 shadow-xl backdrop-blur-md">
      {/* Top brand bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-2.5 transition hover:opacity-90">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c9993a]/30 bg-gradient-to-br from-[#161410] to-[#080808] p-1.5 shadow-inner sm:h-10 sm:w-10">
              <Image src="/logo.png" alt="Sri Murugan Cinema" width={32} height={32} className="h-full w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#e8be6a] sm:text-xs sm:tracking-[0.2em]">
                  Sri Murugan
                </span>
                <span className="hidden rounded-full border border-[#c9993a]/40 bg-[#c9993a]/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#e8be6a] sm:inline-block">
                  Admin Portal
                </span>
              </div>
              <h1 className="truncate text-xs font-bold text-[#f4efe8] sm:text-base max-w-[130px] xs:max-w-[200px] sm:max-w-none">{title}</h1>
            </div>
          </Link>
        </div>

        {/* Global actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {error && <span role="alert" className="hidden text-xs font-medium text-rose-400 md:inline">{error}</span>}

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#111010] px-3 py-1.5 text-xs font-medium text-[#b8b2aa] transition hover:border-[#c9993a]/50 hover:text-[#f4efe8] md:inline-flex"
            title="View customer site in new tab"
          >
            <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Live Site</span>
          </Link>

          <Link
            href="/cafe/pos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/10 px-2.5 py-1.5 text-xs font-bold text-[#e8be6a] transition hover:border-[#c9993a]/70 hover:bg-[#c9993a]/20 sm:px-3"
            title="Open Cafe POS Register"
          >
            <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="12" x="3" y="4" rx="2" />
              <line x1="2" x2="22" y1="20" y2="20" />
            </svg>
            <span>POS<span className="hidden sm:inline"> Terminal</span></span>
          </Link>

          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            aria-label="Sign out of Admin Portal"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#111010] px-2.5 py-1.5 text-xs font-medium text-[#b8b2aa] transition hover:border-rose-900/50 hover:bg-rose-950/30 hover:text-rose-300 disabled:opacity-50 sm:px-3"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs with site gold accents */}
      <div className="border-t border-[#222018] bg-[#0a0806]">
        <nav aria-label="Admin sections" className="no-scrollbar touch-scroll-x mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 sm:px-6">
          {sections.map((section) => {
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
                  isActive
                    ? "border-[#c9993a] bg-[#c9993a]/10 text-[#e8be6a] shadow-[inset_0_-2px_0_0_#c9993a]"
                    : "border-transparent text-[#b8b2aa] hover:border-[#2c2820] hover:bg-[#111010] hover:text-[#f4efe8]"
                }`}
              >
                <span className={isActive ? "text-[#e8be6a]" : "text-[#b8b2aa]"}>{section.icon}</span>
                <span>{section.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
