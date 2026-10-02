"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CafeLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = pin.split("");
    newPin[index] = value;
    const updatedPin = newPin.join("").slice(0, 6);
    setPin(updatedPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6 digits entered
    if (updatedPin.length === 6) {
      void handleLogin(updatedPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setPin(pastedData);
    
    if (pastedData.length === 6) {
      void handleLogin(pastedData);
    } else if (pastedData.length > 0) {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleLogin = async (pinValue: string) => {
    if (pinValue.length < 4) {
      setError("Enter your PIN");
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
        setError(data.error || "Invalid PIN");
        setPin("");
        inputRefs.current[0]?.focus();
        return;
      }

      router.push("/cafe/pos");
    } catch {
      setError("Connection error. Please try again.");
      setPin("");
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleLogin(pin);
  };

  const clearPin = () => {
    setPin("");
    setError("");
    inputRefs.current[0]?.focus();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-amber-400">Sri Murugan Cinema</h1>
          <p className="mt-2 text-xl text-gray-400">Cafe POS System</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 shadow-2xl backdrop-blur sm:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">
            Enter Your PIN
          </h2>

          {/* PIN Input */}
          <div className="mb-6 flex justify-center gap-1.5 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={pin[index] || ""}
                onChange={(e) => handlePinInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="h-14 min-w-0 flex-1 rounded-lg border-2 border-gray-700 bg-gray-800 text-center text-xl font-bold text-white transition-all focus:border-amber-400 focus:outline-none disabled:opacity-50 sm:h-16 sm:max-w-14 sm:text-2xl"
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full rounded-lg bg-amber-500 px-6 py-4 text-lg font-bold uppercase text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging In..." : "Login"}
            </button>

            <button
              type="button"
              onClick={clearPin}
              disabled={loading}
              className="w-full rounded-lg border-2 border-gray-700 px-6 py-3 text-sm font-bold uppercase text-gray-400 transition-all hover:border-gray-600 hover:text-gray-300 disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Staff members only</p>
            <p className="mt-1">PIN is 4-6 digits</p>
          </div>
        </form>

        <div className="mt-8 text-center">
          <a href="/admin/login" className="text-sm text-gray-500 hover:text-gray-400">
            Admin Login →
          </a>
        </div>
      </div>
    </main>
  );
}
