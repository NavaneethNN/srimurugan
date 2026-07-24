"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
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
        router.push("/admin");
        router.refresh();
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative h-20 w-20">
            <Image
              src="/logo.png"
              alt="Sri Murugan Cinema"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gold">Admin Panel</h1>
          <p className="text-sm text-white/50">Enter your password to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <label className="block space-y-2">
            <span className="text-xs font-medium text-white/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-white/50 focus:border-gold focus:outline-none"
              placeholder="Enter password"
              required
              autoFocus
            />
          </label>

          {error && (
            <p className="mt-3 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded bg-gold px-5 py-2.5 text-sm font-semibold text-background transition-all hover:scale-[1.02] hover:bg-gold/90 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
