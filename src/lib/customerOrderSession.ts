import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const CUSTOMER_ORDER_COOKIE = "customer-order-session";
const SESSION_AGE_SECONDS = 24 * 60 * 60;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`customer-order:${payload}`).digest("hex");
}

export function createCustomerOrderSession(orderId: number, secret: string, now = Date.now()) {
  const payload = `${orderId}.${now + SESSION_AGE_SECONDS * 1000}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyCustomerOrderSession(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expiry, supplied] = parts;
  const orderId = Number(id);
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(orderId) || orderId < 1 || !Number.isSafeInteger(expiresAt) || expiresAt <= now ||
      expiresAt > now + SESSION_AGE_SECONDS * 1000 || !/^[a-f0-9]{64}$/.test(supplied)) return null;
  const expected = Buffer.from(signature(`${id}.${expiry}`, secret), "hex");
  const actual = Buffer.from(supplied, "hex");
  return timingSafeEqual(actual, expected) ? orderId : null;
}

export function attachCustomerOrderSession(response: NextResponse, orderId: number) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for customer order sessions");
  response.cookies.set(CUSTOMER_ORDER_COOKIE, createCustomerOrderSession(orderId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/food-orders",
    maxAge: SESSION_AGE_SECONDS,
  });
  return response;
}
