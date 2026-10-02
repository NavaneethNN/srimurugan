import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

function signature(payload: string, password: string, secret: string) {
  return createHmac("sha256", secret).update(`${payload}|${password}`).digest("hex");
}

export function createAdminSession(password: string, secret: string) {
  const expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
  const payload = `v1.${expiresAt}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${signature(payload, password, secret)}`;
}

export function verifyAdminSession(token: string | undefined, password: string, secret: string) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1" || !/^\d{13}$/.test(parts[1]) || !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[3])) return false;
  const expiresAt = Number(parts[1]);
  if (expiresAt <= Date.now() || expiresAt > Date.now() + ADMIN_SESSION_SECONDS * 1000) return false;
  const expected = Buffer.from(signature(parts.slice(0, 3).join("."), password, secret), "hex");
  const supplied = Buffer.from(parts[3], "hex");
  return timingSafeEqual(supplied, expected);
}

export function isAdminPasswordValid(value: unknown, password: string) {
  if (typeof value !== "string" || value.length > 256) return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(password);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
