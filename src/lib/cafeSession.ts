import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cafeUsers } from "@/lib/schema";

const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

function sessionSignature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`cafe-session:${payload}`).digest("hex");
}

export function createCafeSession(userId: number, secret: string, now = Date.now()) {
  const payload = `${userId}.${now + SESSION_LIFETIME_MS}`;
  return `${payload}.${sessionSignature(payload, secret)}`;
}

export function verifyCafeSession(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expiry, signature] = parts;
  const userId = Number(id);
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(expiresAt) || expiresAt <= now ||
      expiresAt > now + SESSION_LIFETIME_MS || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const expected = Buffer.from(sessionSignature(`${id}.${expiry}`, secret), "hex");
  const actual = Buffer.from(signature, "hex");
  return timingSafeEqual(actual, expected) ? userId : null;
}

export async function authenticatedCafeUser(token: string | undefined) {
  const id = verifyCafeSession(token, process.env.SESSION_SECRET);
  if (!id) return null;
  const { getDb } = await import("@/lib/db");
  const [user] = await getDb().select({ id: cafeUsers.id, name: cafeUsers.name, isActive: cafeUsers.isActive })
    .from(cafeUsers).where(eq(cafeUsers.id, id)).limit(1);
  return user?.isActive ? { id: user.id, name: user.name } : null;
}
