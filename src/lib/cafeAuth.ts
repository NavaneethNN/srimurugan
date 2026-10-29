import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hashes a 4-6 digit numeric PIN with a cryptographically secure random salt using scrypt.
 */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `s1:${salt}:${hash}`;
}

/**
 * Verifies a PIN against a stored hash (or legacy plaintext fallback for backward compatibility).
 */
export function verifyPin(pin: string, stored: string): boolean {
  if (stored.startsWith("s1:")) {
    const parts = stored.split(":");
    if (parts.length !== 3) return false;
    const [, salt, expectedHash] = parts;
    const computed = scryptSync(pin, salt, 32).toString("hex");
    const a = Buffer.from(expectedHash, "hex");
    const b = Buffer.from(computed, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }

  // Safe fallback for legacy plaintext PINs
  const a = Buffer.from(stored);
  const b = Buffer.from(pin);
  return a.length === b.length && timingSafeEqual(a, b);
}

// In-memory sliding rate limiter for authentication endpoints
type AttemptRecord = { count: number; firstAttempt: number; lastAttempt: number };
const attempts = new Map<string, AttemptRecord>();

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now - record.lastAttempt > 300_000) { // 5 minutes
      attempts.delete(key);
    }
  }
}, 60_000).unref();

export function checkLoginRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  if (now - record.firstAttempt > windowMs) {
    attempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLogin(key: string, windowMs = 60_000): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAttempt > windowMs) {
    attempts.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
  } else {
    record.count += 1;
    record.lastAttempt = now;
  }
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
