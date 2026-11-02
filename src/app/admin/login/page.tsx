"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError("Invalid administrator password. Please try again.");
      }
    } catch {
      setError("Network error communicating with server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090c12] px-4 text-slate-100">
      {/* Ambient Cinema Lighting Backdrops */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-amber-600/5 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Cinema Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-black p-3 shadow-xl shadow-amber-500/10">
            <Image
              src="/logo.png"
              alt="Sri Murugan Cinema"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Operations & Portal
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Sri Murugan Cinema
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Sign in to manage live seat orders, tickets, and theatrical schedules
          </p>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-[#0d121c]/90 to-[#090c12] p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Master Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-4 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                  placeholder="Enter administrator password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-200"
              >
                <svg className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Command Center</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Quick link back */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 transition hover:text-amber-400"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Cinema website</span>
            </Link>

            <Link
              href="/cafe/login"
              className="font-medium text-slate-300 underline transition hover:text-amber-300"
            >
              Cafe Staff POS
            </Link>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
          <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Authorized cinema personnel only • Session protected</span>
        </div>
      </div>
    </main>
  );
}
