import { createHmac, timingSafeEqual } from "node:crypto";

const apiBase = "https://api.razorpay.com/v1";

export class RazorpayBusyError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Payment checkout is busy. Please retry in a moment.");
  }
}

function credentials() {
  const keyId = process.env.RAZORPAY_TEST_API_KEY?.trim();
  const keySecret = process.env.RAZORPAY_TEST_API_SECRET?.trim();
  if (!keyId || !keySecret) throw new Error("Razorpay test credentials are missing");
  return { keyId, keySecret };
}

export function razorpayKeyId() {
  return credentials().keyId;
}

async function requestRazorpay<T>(path: string, method = "GET", body?: object): Promise<T> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 429) {
    const seconds = Number(response.headers.get("retry-after"));
    throw new RazorpayBusyError(Number.isFinite(seconds) && seconds > 0 ? Math.min(30, Math.ceil(seconds)) : 3);
  }
  if (!response.ok) {
    console.error("Razorpay API request failed", method, path, response.status);
    throw new Error("Payment service is temporarily unavailable. Please try again.");
  }
  return response.json() as Promise<T>;
}

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
};

export function isCapturedFoodPayment(payment: RazorpayPayment, razorpayOrderId: string, paymentId: string, amountPaise: number) {
  return payment.id === paymentId && payment.status === "captured" && payment.captured === true &&
    payment.order_id === razorpayOrderId && payment.amount === amountPaise && payment.currency === "INR";
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  return requestRazorpay<{ id: string; amount: number; currency: string }>("/orders", "POST", {
    amount,
    currency: "INR",
    receipt,
  });
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, supplied: string) {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", credentials().keySecret).update(`${orderId}|${paymentId}`).digest();
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyRazorpayWebhook(body: string, supplied: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function fetchRazorpayPayment(paymentId: string) {
  return requestRazorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function fetchRazorpayOrderPayments(orderId: string) {
  return requestRazorpay<{ items: RazorpayPayment[] }>(`/orders/${encodeURIComponent(orderId)}/payments`);
}

export async function captureRazorpayPayment(paymentId: string, amount: number) {
  return requestRazorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, "POST", {
    amount,
    currency: "INR",
  });
}
