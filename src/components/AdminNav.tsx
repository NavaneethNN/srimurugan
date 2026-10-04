"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const sections = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/cafe", label: "Menu" },
  { href: "/admin/cafe-users", label: "Staff" },
  { href: "/admin/movies", label: "Movies" },
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
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Link href="/admin/dashboard" className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Sri Murugan Cinema</Link>
          <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">{error && <span role="alert" className="text-xs text-rose-300">{error}</span>}<button type="button" onClick={() => void signOut()} disabled={signingOut} className="min-h-9 rounded-md border border-slate-700 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">{signingOut ? "Signing out…" : "Sign out"}</button></div>
      </div>
      <nav aria-label="Admin sections" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
        {sections.map((section) => <Link key={section.href} href={section.href} aria-current={pathname === section.href ? "page" : undefined}
          className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${pathname === section.href ? "border-slate-100 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>
          {section.label}
        </Link>)}
      </nav>
    </header>
  );
}
