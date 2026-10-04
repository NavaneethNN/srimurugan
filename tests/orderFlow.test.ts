import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { createAdminSession, verifyAdminSession } from "../src/lib/adminSession";
import { recommendAddOns, recommendVariantUpgrade } from "../src/lib/foodRecommendations";
import { isCapturedFoodPayment, verifyRazorpaySignature, verifyRazorpayWebhook } from "../src/lib/razorpay";
import { readJsonBody, RequestTooLargeError } from "../src/lib/requestBody";
import { createCafeSession, verifyCafeSession } from "../src/lib/cafeSession";
import { createCustomerOrderSession, verifyCustomerOrderSession } from "../src/lib/customerOrderSession";
import type { FoodCategory, FoodProduct } from "../src/lib/foodMenu";

const categories: FoodCategory[] = [
  { id: 1, name: "Snacks", sortOrder: 0 },
  { id: 2, name: "Drinks", sortOrder: 1 },
  { id: 3, name: "Desserts", sortOrder: 2 },
];
const product = (id: number, categoryId: number, pricePaise: number | null, isAvailable = true): FoodProduct => ({
  id, categoryId, name: `Product ${id}`, description: "", imageUrl: "", tag: null,
  variants: [{ id: `v${id}`, name: "Regular", pricePaise }], isAvailable, sortOrder: id,
});

test("upsells a complementary priced drink without repeating the cart item", () => {
  const products = [product(1, 1, 30000), product(2, 2, 8000), product(3, 2, null), product(4, 3, 10000, false)];
  const suggestions = recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 30000);
  assert.equal(suggestions[0]?.product.id, 2);
  assert.ok(suggestions.every((item) => item.product.id !== 1 && item.variant.pricePaise !== null && item.product.isAvailable));
});

test("suggests a larger drink only when its unit price is lower", () => {
  const coke = product(10, 2, 10000);
  coke.variants = [
    { id: "small", name: "450 ml", pricePaise: 10000 },
    { id: "large", name: "750 ml", pricePaise: 14000 },
  ];
  const upgrade = recommendVariantUpgrade([coke], [{ productId: 10, variantId: "small", quantity: 1 }], 10000);
  assert.equal(upgrade?.to.id, "large");
  assert.equal(upgrade?.additionalPaise, 4000);
  coke.variants[1].pricePaise = 18000;
  assert.equal(recommendVariantUpgrade([coke], [{ productId: 10, variantId: "small", quantity: 1 }], 10000), null);
});

test("admin sessions reject tampering and expired tokens", () => {
  const token = createAdminSession("password", "secret");
  assert.equal(verifyAdminSession(token, "password", "secret"), true);
  assert.equal(verifyAdminSession(token, "changed", "secret"), false);
  const parts = token.split(".");
  parts[1] = String(Date.now() - 1);
  assert.equal(verifyAdminSession(parts.join("."), "password", "secret"), false);
});

test("cafe sessions require a valid signature and expire", () => {
  const now = Date.now();
  const token = createCafeSession(3, "secret", now);
  assert.equal(verifyCafeSession(token, "secret", now), 3);
  assert.equal(verifyCafeSession(token, "wrong-secret", now), null);
  assert.equal(verifyCafeSession(token, "secret", now + 12 * 60 * 60 * 1000 + 1), null);
  assert.equal(verifyCafeSession(token.replace(/^3/, "4"), "secret", now), null);
  assert.equal(verifyCafeSession("3:1234", "secret", now), null);
});

test("customer order sessions only grant access to the signed order and expire", () => {
  const now = Date.now();
  const token = createCustomerOrderSession(25, "secret", now);
  assert.equal(verifyCustomerOrderSession(token, "secret", now), 25);
  assert.equal(verifyCustomerOrderSession(token, "wrong-secret", now), null);
  assert.equal(verifyCustomerOrderSession(token.replace(/^25/, "26"), "secret", now), null);
  assert.equal(verifyCustomerOrderSession(token, "secret", now + 24 * 60 * 60 * 1000 + 1), null);
  assert.equal(verifyCustomerOrderSession(undefined, "secret", now), null);
});

test("Razorpay signatures are checked against trusted order IDs and raw webhook bodies", () => {
  process.env.RAZORPAY_TEST_API_KEY = "rzp_test_example";
  process.env.RAZORPAY_TEST_API_SECRET = "test-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  const signature = createHmac("sha256", "test-secret").update("order_123|pay_123").digest("hex");
  assert.equal(verifyRazorpaySignature("order_123", "pay_123", signature), true);
  assert.equal(verifyRazorpaySignature("order_456", "pay_123", signature), false);
  const body = '{"event":"payment.captured"}';
  const webhookSignature = createHmac("sha256", "webhook-secret").update(body).digest("hex");
  assert.equal(verifyRazorpayWebhook(body, webhookSignature), true);
  assert.equal(verifyRazorpayWebhook(`${body} `, webhookSignature), false);
});

test("only a captured payment for the exact order, payment ID, amount and currency can confirm food", () => {
  const payment = { id: "pay_123", order_id: "order_123", amount: 100, currency: "INR", status: "captured", captured: true };
  assert.equal(isCapturedFoodPayment(payment, "order_123", "pay_123", 100), true);
  assert.equal(isCapturedFoodPayment({ ...payment, status: "failed" }, "order_123", "pay_123", 100), false);
  assert.equal(isCapturedFoodPayment({ ...payment, status: "authorized", captured: false }, "order_123", "pay_123", 100), false);
  assert.equal(isCapturedFoodPayment({ ...payment, captured: false }, "order_123", "pay_123", 100), false);
  assert.equal(isCapturedFoodPayment(payment, "order_other", "pay_123", 100), false);
  assert.equal(isCapturedFoodPayment(payment, "order_123", "pay_other", 100), false);
  assert.equal(isCapturedFoodPayment(payment, "order_123", "pay_123", 101), false);
  assert.equal(isCapturedFoodPayment({ ...payment, currency: "USD" }, "order_123", "pay_123", 100), false);
});

test("request bodies over the checkout limit are rejected even without Content-Length", async () => {
  const request = new Request("https://example.test/api/food-orders", { method: "POST", body: JSON.stringify({ text: "x".repeat(200) }) });
  await assert.rejects(readJsonBody(request, 100), RequestTooLargeError);
});
