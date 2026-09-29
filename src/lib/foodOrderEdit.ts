import { createHmac, timingSafeEqual } from "node:crypto";

export const SEAT_EDIT_WINDOW_MS = 25_000;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is required for seat edits");
  return value;
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSeatEditToken(orderId: number, expiresAt: number) {
  const payload = `${orderId}.${expiresAt}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySeatEditToken(token: unknown, orderId: number) {
  if (typeof token !== "string") return false;
  const [id, expiry, suppliedSignature, extra] = token.split(".");
  if (extra || Number(id) !== orderId || !/^\d+$/.test(expiry) || Number(expiry) <= Date.now() || !suppliedSignature) return false;
  const expected = Buffer.from(signature(`${id}.${expiry}`));
  const supplied = Buffer.from(suppliedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
