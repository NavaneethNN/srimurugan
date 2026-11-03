"use client";

import { FormEvent, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function CafeLoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const pin = digits.join("");

  const handleLogin = useCallback(async (pinValue: string) => {
    if (pinValue.length < 4) {
      setError("Please enter your 4 to 6-digit staff PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cafe/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid PIN. Please check and try again.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      router.push("/cafe/pos");
      router.refresh();
    } catch {
      setError("Connection error communicating with terminal. Please retry.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = "";
      setDigits(updated);
      return;
    }

    if (cleaned.length === 1) {
      const updated = [...digits];
      updated[index] = cleaned;
      setDigits(updated);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      const fullPin = updated.join("");
      if (fullPin.length === 6) {
        void handleLogin(fullPin);
      }
    } else {
      // Pasted or autofilled multiple digits
      const chars = cleaned.slice(0, 6).split("");
      const updated = [...digits];
      for (let i = 0; i < 6; i++) {
        if (chars[i]) updated[i] = chars[i];
      }
      setDigits(updated);
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus();

      const fullPin = updated.join("");
      if (fullPin.length === 6) {
        void handleLogin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const updated = [...digits];
        updated[index - 1] = "";
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const chars = pasted.split("");
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < chars.length; i++) {
      updated[i] = chars[i];
    }
    setDigits(updated);

    const nextIndex = Math.min(chars.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      void handleLogin(pasted);
    }
  };

  const clearPin = () => {
    setDigits(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleLogin(pin);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-4 py-8 text-[#f4efe8]">
      {/* Ambient Cinema Lighting Backdrops */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#c9993a]/10 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-[#9a7228]/10 blur-[140px]" />

      <div className="relative w-full max-w-md">
        {/* Cinema Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="group flex flex-col items-center transition hover:opacity-90">
            <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#c9993a]/30 bg-gradient-to-b from-[#161410] to-[#080808] p-3 shadow-xl shadow-[#c9993a]/10 group-hover:border-[#c9993a]/60">
              <Image
                src="/logo.png"
                alt="Sri Murugan Cinema"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#c9993a]/40 bg-[#c9993a]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8be6a]">
                Cafe POS Register
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Sri Murugan Cinema
            </h1>
            <p className="mt-1 font-dancing text-lg text-[#c9993a]">
              Concessions & Counter Login
            </p>
          </Link>
        </div>

        {/* PIN Entry Card */}
        <div className="rounded-3xl border border-[#222018] bg-gradient-to-b from-[#111010]/95 via-[#161410]/95 to-[#080808] p-4 xs:p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit}>
            <div className="mb-5 text-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Enter Staff Access PIN
              </h2>
              <p className="mt-1 text-xs text-[#b8b2aa]">
                4 to 6-digit numeric terminal passcode
              </p>
            </div>

            {/* PIN Inputs (Hidden caret, glowing boxes with dots) */}
            <div className="mb-5 flex justify-center gap-1.5 xs:gap-2 sm:gap-2.5">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = digits[index] !== "";
                return (
                  <div key={index} className="relative">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digits[index]}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                      aria-label={`PIN digit ${index + 1}`}
                      className={`h-11 w-9 xs:w-10 sm:h-14 sm:w-13 rounded-xl border-2 text-center font-mono text-lg font-bold transition-all sm:text-2xl text-transparent caret-transparent select-none ${
                        isFilled
                          ? "border-[#c9993a] bg-[#c9993a]/15 shadow-[0_0_12px_rgba(201,153,58,0.25)]"
                          : "border-[#2c2820] bg-[#111010] focus:border-[#c9993a] focus:bg-[#161410] focus:outline-none focus:ring-1 focus:ring-[#c9993a]/50"
                      } disabled:opacity-50`}
                      style={{
                        color: "transparent",
                        WebkitTextFillColor: "transparent",
                        caretColor: "transparent",
                      }}
                    />
                    {isFilled && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#f4efe8] via-[#e8be6a] to-[#c9993a] shadow-[0_0_8px_rgba(232,190,106,0.8)]"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clear PIN Action if user started typing */}
            {pin.length > 0 && !loading && (
              <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={clearPin}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2c2820] bg-[#161410] px-3 py-1 text-[11px] font-semibold text-[#b8b2aa] hover:border-rose-500/40 hover:bg-rose-950/20 hover:text-rose-300 transition"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Clear digits</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-200"
              >
                <svg className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] text-xs font-bold uppercase tracking-wider text-[#080808] shadow-lg shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  </svg>
                  <span>Authenticating Terminal...</span>
                </>
              ) : (
                <>
                  <span>Sign In to POS Terminal</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Quick Footer Links */}
          <div className="mt-6 flex items-center justify-between border-t border-[#222018] pt-4 text-xs text-[#b8b2aa]">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 transition hover:text-[#e8be6a]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Cinema Website</span>
            </Link>

            <Link
              href="/admin/login"
              className="font-medium text-slate-300 transition hover:text-[#e8be6a]"
            >
              Admin Portal →
            </Link>
          </div>
        </div>

        {/* Security Notice & PIN Help */}
        <div className="mt-6 space-y-1.5 text-center text-[11px] text-[#b8b2aa]/70">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Authorized Sri Murugan Staff Only • Terminal Protected</span>
          </div>
          <p>
            Need to change or reset your PIN? Visit the{" "}
            <Link href="/admin/cafe-users" className="text-[#e8be6a] hover:underline">
              Admin Staff Portal
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
