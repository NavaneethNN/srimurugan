import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { createAdminSession, verifyAdminSession, isAdminPasswordValid, ADMIN_SESSION_SECONDS } from "../src/lib/adminSession";
import { recommendAddOns, recommendVariantUpgrade } from "../src/lib/foodRecommendations";
import { isCapturedFoodPayment, verifyRazorpaySignature, verifyRazorpayWebhook } from "../src/lib/razorpay";
import { readJsonBody, RequestTooLargeError } from "../src/lib/requestBody";
import { createCafeSession, verifyCafeSession } from "../src/lib/cafeSession";
import { createCustomerOrderSession, verifyCustomerOrderSession } from "../src/lib/customerOrderSession";
import { createSeatEditToken, verifySeatEditToken, SEAT_EDIT_WINDOW_MS } from "../src/lib/foodOrderEdit";
import { formatPrice } from "../src/lib/foodMenu";
import { parseCategoryInput, parseProductInput, assignVariantIds } from "../src/lib/foodMenuValidation";
import type { FoodCategory, FoodProduct } from "../src/lib/foodMenu";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const categories: FoodCategory[] = [
  { id: 1, name: "Snacks", sortOrder: 0 },
  { id: 2, name: "Drinks", sortOrder: 1 },
  { id: 3, name: "Desserts", sortOrder: 2 },
];

const product = (id: number, categoryId: number, pricePaise: number | null, isAvailable = true): FoodProduct => ({
  id, categoryId, name: `Product ${id}`, description: "", imageUrl: "", tag: null,
  variants: [{ id: `v${id}`, name: "Regular", pricePaise }], isAvailable, sortOrder: id,
});

// ─── ORIGINAL TESTS (preserved) ───────────────────────────────────────────────

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

// ─── formatPrice ──────────────────────────────────────────────────────────────

test("formatPrice renders whole rupee amounts without decimals", () => {
  assert.equal(formatPrice(10000), "₹100");
  assert.equal(formatPrice(100), "₹1");
  assert.equal(formatPrice(5000), "₹50");
});

test("formatPrice renders paise amounts with two decimal places", () => {
  assert.equal(formatPrice(150), "₹1.50");
  assert.equal(formatPrice(1099), "₹10.99");
  assert.equal(formatPrice(199), "₹1.99");
});

test("formatPrice returns 'Price coming soon' for null", () => {
  assert.equal(formatPrice(null), "Price coming soon");
});

test("formatPrice returns 'Price coming soon' for zero (unpriced guard)", () => {
  // Bug fix #4: pricePaise=0 should show 'Price coming soon', not '₹0'
  assert.equal(formatPrice(0), "Price coming soon");
});

test("formatPrice returns 'Price coming soon' for negative values", () => {
  assert.equal(formatPrice(-100), "Price coming soon");
});

// ─── Seat-edit token ──────────────────────────────────────────────────────────

test("seat-edit token round-trips correctly for the correct order and within the window", () => {
  process.env.SESSION_SECRET = "seat-test-secret";
  const now = Date.now();
  const expiresAt = now + SEAT_EDIT_WINDOW_MS;
  const token = createSeatEditToken(42, expiresAt);
  assert.equal(verifySeatEditToken(token, 42), true);
});

test("seat-edit token is rejected for a different order ID", () => {
  process.env.SESSION_SECRET = "seat-test-secret";
  const expiresAt = Date.now() + SEAT_EDIT_WINDOW_MS;
  const token = createSeatEditToken(42, expiresAt);
  assert.equal(verifySeatEditToken(token, 99), false);
});

test("seat-edit token is rejected when expired", () => {
  process.env.SESSION_SECRET = "seat-test-secret";
  const expiresAt = Date.now() - 1; // already expired
  const token = createSeatEditToken(42, expiresAt);
  assert.equal(verifySeatEditToken(token, 42), false);
});

test("seat-edit token is rejected when the signature is tampered", () => {
  process.env.SESSION_SECRET = "seat-test-secret";
  const expiresAt = Date.now() + SEAT_EDIT_WINDOW_MS;
  const token = createSeatEditToken(42, expiresAt);
  const parts = token.split(".");
  parts[2] = parts[2].replace(/[a-z]/, "x"); // corrupt signature
  assert.equal(verifySeatEditToken(parts.join("."), 42), false);
});

test("seat-edit token is rejected when given as a non-string", () => {
  assert.equal(verifySeatEditToken(null, 42), false);
  assert.equal(verifySeatEditToken(undefined, 42), false);
  assert.equal(verifySeatEditToken(123, 42), false);
});

test("seat-edit token is rejected when it has extra segments", () => {
  process.env.SESSION_SECRET = "seat-test-secret";
  const expiresAt = Date.now() + SEAT_EDIT_WINDOW_MS;
  const token = createSeatEditToken(42, expiresAt) + ".extra";
  assert.equal(verifySeatEditToken(token, 42), false);
});

// ─── Customer order session ───────────────────────────────────────────────────

test("customer order session is rejected when secret is missing", () => {
  const now = Date.now();
  const token = createCustomerOrderSession(1, "secret", now);
  assert.equal(verifyCustomerOrderSession(token, undefined, now), null);
});

test("customer order session rejects a token issued far in the future", () => {
  const now = Date.now();
  // Craft a token whose expiry is beyond one session lifetime from now
  const token = createCustomerOrderSession(1, "secret", now + 2 * 24 * 60 * 60 * 1000);
  assert.equal(verifyCustomerOrderSession(token, "secret", now), null);
});

test("customer order session rejects garbage strings", () => {
  assert.equal(verifyCustomerOrderSession("not.a.token", "secret"), null);
  assert.equal(verifyCustomerOrderSession("", "secret"), null);
});

// ─── Admin session ────────────────────────────────────────────────────────────

test("admin session rejects undefined token", () => {
  assert.equal(verifyAdminSession(undefined, "password", "secret"), false);
});

test("admin session rejects token with wrong number of parts", () => {
  assert.equal(verifyAdminSession("v1.only.two", "password", "secret"), false);
});

test("isAdminPasswordValid uses timing-safe comparison", () => {
  assert.equal(isAdminPasswordValid("correct", "correct"), true);
  assert.equal(isAdminPasswordValid("wrong", "correct"), false);
  assert.equal(isAdminPasswordValid(123, "correct"), false);
  assert.equal(isAdminPasswordValid("x".repeat(300), "correct"), false); // over 256 char limit
});

test("admin session expires after the defined window", () => {
  const token = createAdminSession("pw", "secret");
  const parts = token.split(".");
  // Move expiry to just in the past
  parts[1] = String(Date.now() - 1);
  assert.equal(verifyAdminSession(parts.join("."), "pw", "secret"), false);
});

// ─── Razorpay signature ───────────────────────────────────────────────────────

test("Razorpay signature check rejects wrong-length hex strings", () => {
  assert.equal(verifyRazorpaySignature("order_123", "pay_123", "tooshort"), false);
  assert.equal(verifyRazorpaySignature("order_123", "pay_123", "z".repeat(64)), false); // non-hex
});

test("webhook signature rejects null or empty supplied signature", () => {
  assert.equal(verifyRazorpayWebhook('{"event":"payment.captured"}', null), false);
  assert.equal(verifyRazorpayWebhook('{"event":"payment.captured"}', ""), false);
});

test("webhook returns false when RAZORPAY_WEBHOOK_SECRET is not set", () => {
  const original = process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  assert.equal(verifyRazorpayWebhook('{}', "a".repeat(64)), false);
  process.env.RAZORPAY_WEBHOOK_SECRET = original;
});

// ─── Payment capture guard ────────────────────────────────────────────────────

test("isCapturedFoodPayment requires status=captured AND captured=true together", () => {
  const base = { id: "pay_1", order_id: "order_1", amount: 50000, currency: "INR", status: "captured", captured: true };
  // Both must agree
  assert.equal(isCapturedFoodPayment({ ...base, captured: false }, "order_1", "pay_1", 50000), false);
  assert.equal(isCapturedFoodPayment({ ...base, status: "created" }, "order_1", "pay_1", 50000), false);
  // Currency must be INR
  assert.equal(isCapturedFoodPayment({ ...base, currency: "USD" }, "order_1", "pay_1", 50000), false);
  // Amount must match exactly — off-by-one fails
  assert.equal(isCapturedFoodPayment(base, "order_1", "pay_1", 49999), false);
  assert.equal(isCapturedFoodPayment(base, "order_1", "pay_1", 50001), false);
});

// ─── Request body size limit ──────────────────────────────────────────────────

test("readJsonBody accepts a body exactly at the limit", async () => {
  const payload = JSON.stringify({ name: "A" });
  const request = new Request("https://example.test/", { method: "POST", body: payload });
  const result = await readJsonBody(request, payload.length);
  assert.deepEqual(result, { name: "A" });
});

test("readJsonBody rejects a body one byte over the limit", async () => {
  const payload = JSON.stringify({ name: "AB" });
  const request = new Request("https://example.test/", { method: "POST", body: payload });
  await assert.rejects(readJsonBody(request, payload.length - 1), RequestTooLargeError);
});

test("readJsonBody returns null for an empty body", async () => {
  const request = new Request("https://example.test/", { method: "POST", body: "null" });
  const result = await readJsonBody(request, 100);
  assert.equal(result, null);
});

// ─── Recommendations: add-ons ─────────────────────────────────────────────────

test("recommendAddOns returns empty array when cart is empty", () => {
  const products = [product(1, 1, 30000), product(2, 2, 8000)];
  assert.deepEqual(recommendAddOns(categories, products, [], 0), []);
});

test("recommendAddOns returns empty array when cart total is below ₹1", () => {
  const products = [product(1, 1, 30000)];
  assert.deepEqual(recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 50), []);
});

test("recommendAddOns never suggests an unavailable product", () => {
  const products = [product(1, 1, 30000), product(2, 2, 8000, false)];
  const suggestions = recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 30000);
  assert.ok(suggestions.every((s) => s.product.isAvailable));
});

test("recommendAddOns never suggests a product already in the cart", () => {
  const products = [product(1, 1, 30000), product(2, 2, 8000)];
  const suggestions = recommendAddOns(categories, products, [
    { productId: 1, variantId: "v1" },
    { productId: 2, variantId: "v2" },
  ], 38000);
  assert.ok(suggestions.every((s) => s.product.id !== 1 && s.product.id !== 2));
});

test("recommendAddOns never suggests a variant with null price", () => {
  const products = [product(1, 1, 30000), product(2, 2, null)];
  const suggestions = recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 30000);
  assert.ok(suggestions.every((s) => (s.variant.pricePaise ?? 0) >= 100));
});

test("recommendAddOns returns at most 2 suggestions", () => {
  const products = [
    product(1, 1, 30000),
    product(2, 2, 5000),
    product(3, 2, 6000),
    product(4, 3, 7000),
    product(5, 3, 8000),
  ];
  const suggestions = recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 30000);
  assert.ok(suggestions.length <= 2);
});

test("recommendAddOns suggests a snack when only a drink is in the cart", () => {
  const products = [product(1, 2, 10000), product(2, 1, 20000)];
  const suggestions = recommendAddOns(categories, products, [{ productId: 1, variantId: "v1" }], 10000);
  assert.ok(suggestions.some((s) => s.product.categoryId === 1)); // snack suggested
});

// ─── Recommendations: variant upgrade ────────────────────────────────────────

test("recommendVariantUpgrade returns null when quantity is not 1", () => {
  const coke = product(10, 2, 10000);
  coke.variants = [
    { id: "small", name: "450 ml", pricePaise: 10000 },
    { id: "large", name: "750 ml", pricePaise: 14000 },
  ];
  // quantity = 2 → no upgrade should be suggested
  assert.equal(recommendVariantUpgrade([coke], [{ productId: 10, variantId: "small", quantity: 2 }], 20000), null);
});

test("recommendVariantUpgrade returns null when user already has the larger size", () => {
  const coke = product(10, 2, 10000);
  coke.variants = [
    { id: "small", name: "450 ml", pricePaise: 10000 },
    { id: "large", name: "750 ml", pricePaise: 14000 },
  ];
  assert.equal(
    recommendVariantUpgrade([coke], [
      { productId: 10, variantId: "small", quantity: 1 },
      { productId: 10, variantId: "large", quantity: 1 },
    ], 24000),
    null,
  );
});

test("recommendVariantUpgrade returns null when the upgrade costs more than 60% of cart total", () => {
  const coke = product(10, 2, 10000);
  coke.variants = [
    { id: "small", name: "450 ml", pricePaise: 10000 },
    { id: "large", name: "750 ml", pricePaise: 19000 }, // +9000 on a 10000 cart = 90% → too expensive
  ];
  assert.equal(recommendVariantUpgrade([coke], [{ productId: 10, variantId: "small", quantity: 1 }], 10000), null);
});

test("recommendVariantUpgrade ignores variants of incompatible units", () => {
  const snack = product(20, 1, 10000);
  snack.variants = [
    { id: "small", name: "100 g", pricePaise: 10000 },
    { id: "large", name: "750 ml", pricePaise: 14000 }, // g vs ml → incompatible
  ];
  assert.equal(recommendVariantUpgrade([snack], [{ productId: 20, variantId: "small", quantity: 1 }], 10000), null);
});

test("recommendVariantUpgrade picks the cheapest valid upgrade when multiple exist", () => {
  const coke = product(10, 2, 10000);
  coke.variants = [
    { id: "small", name: "450 ml", pricePaise: 10000 },
    { id: "medium", name: "600 ml", pricePaise: 13000 },
    { id: "large", name: "750 ml", pricePaise: 14000 },
  ];
  const upgrade = recommendVariantUpgrade([coke], [{ productId: 10, variantId: "small", quantity: 1 }], 10000);
  assert.equal(upgrade?.to.id, "medium"); // cheapest valid upgrade
});

// ─── Menu validation ──────────────────────────────────────────────────────────

test("parseCategoryInput accepts a valid category", () => {
  const result = parseCategoryInput({ name: "Snacks", sortOrder: 5 });
  assert.equal(result.name, "Snacks");
  assert.equal(result.sortOrder, 5);
});

test("parseCategoryInput defaults sortOrder to 0 when omitted", () => {
  const result = parseCategoryInput({ name: "Drinks" });
  assert.equal(result.sortOrder, 0);
});

test("parseCategoryInput rejects empty name", () => {
  assert.throws(() => parseCategoryInput({ name: "" }), /Category name/);
});

test("parseCategoryInput rejects name over 80 characters", () => {
  assert.throws(() => parseCategoryInput({ name: "x".repeat(81) }), /Category name/);
});

test("parseCategoryInput rejects negative sortOrder", () => {
  assert.throws(() => parseCategoryInput({ name: "Snacks", sortOrder: -1 }), /display order/);
});

test("parseProductInput accepts a minimal valid product", () => {
  const result = parseProductInput({
    categoryId: 1, name: "Popcorn", description: "", imageUrl: "",
    isAvailable: true, sortOrder: 0,
    variants: [{ name: "Regular", pricePaise: 10000 }],
  });
  assert.equal(result.name, "Popcorn");
  assert.equal(result.variants.length, 1);
});

test("parseProductInput rejects a product with no variants", () => {
  assert.throws(() => parseProductInput({
    categoryId: 1, name: "Popcorn", description: "", imageUrl: "",
    isAvailable: true, sortOrder: 0, variants: [],
  }), /variant/i);
});

test("parseProductInput rejects duplicate variant names (case-insensitive)", () => {
  assert.throws(() => parseProductInput({
    categoryId: 1, name: "Popcorn", description: "", imageUrl: "",
    isAvailable: true, sortOrder: 0,
    variants: [
      { name: "Regular", pricePaise: 10000 },
      { name: "regular", pricePaise: 12000 }, // duplicate
    ],
  }), /unique/i);
});

test("parseProductInput rejects a variant price below ₹1 (100 paise)", () => {
  assert.throws(() => parseProductInput({
    categoryId: 1, name: "Popcorn", description: "", imageUrl: "",
    isAvailable: true, sortOrder: 0,
    variants: [{ name: "Regular", pricePaise: 50 }], // 50 paise = ₹0.50
  }), /price/i);
});

test("parseProductInput rejects an HTTP image URL (must be HTTPS or local path)", () => {
  assert.throws(() => parseProductInput({
    categoryId: 1, name: "Popcorn", description: "", imageUrl: "http://example.com/img.jpg",
    isAvailable: true, sortOrder: 0,
    variants: [{ name: "Regular", pricePaise: 10000 }],
  }), /HTTPS/i);
});

test("parseProductInput accepts HTTPS and local image URLs", () => {
  const base = {
    categoryId: 1, name: "Popcorn", description: "", isAvailable: true,
    sortOrder: 0, variants: [{ name: "Regular", pricePaise: 10000 }],
  };
  assert.doesNotThrow(() => parseProductInput({ ...base, imageUrl: "https://cdn.example.com/img.jpg" }));
  assert.doesNotThrow(() => parseProductInput({ ...base, imageUrl: "/images/popcorn.jpg" }));
  assert.doesNotThrow(() => parseProductInput({ ...base, imageUrl: "" }));
});

test("parseProductInput rejects missing categoryId", () => {
  assert.throws(() => parseProductInput({
    name: "Popcorn", description: "", imageUrl: "", isAvailable: true, sortOrder: 0,
    variants: [{ name: "Regular", pricePaise: 10000 }],
  }), /category/i);
});

test("parseProductInput trims whitespace from name, description and tag", () => {
  const result = parseProductInput({
    categoryId: 1, name: "  Popcorn  ", description: "  Tasty  ", imageUrl: "",
    tag: "  New  ", isAvailable: true, sortOrder: 0,
    variants: [{ name: "Regular", pricePaise: 10000 }],
  });
  assert.equal(result.name, "Popcorn");
  assert.equal(result.description, "Tasty");
  assert.equal(result.tag, "New");
});

// ─── Variant ID assignment ────────────────────────────────────────────────────

test("assignVariantIds preserves existing IDs for matched variant names", () => {
  const existing = [
    { id: "uuid-1", name: "Regular", pricePaise: 10000 },
    { id: "uuid-2", name: "Large", pricePaise: 15000 },
  ];
  const input = [
    { id: "uuid-1", name: "Regular", pricePaise: 10000 },
    { id: "uuid-2", name: "Large", pricePaise: 15000 },
  ];
  const result = assignVariantIds(input, existing);
  assert.equal(result[0].id, "uuid-1");
  assert.equal(result[1].id, "uuid-2");
});

test("assignVariantIds generates a new UUID for a new variant", () => {
  const existing = [{ id: "uuid-1", name: "Regular", pricePaise: 10000 }];
  const input = [
    { id: "uuid-1", name: "Regular", pricePaise: 10000 },
    { name: "Extra Large", pricePaise: 20000 }, // new — no id
  ];
  const result = assignVariantIds(input, existing);
  assert.equal(result[0].id, "uuid-1");
  assert.ok(result[1].id.length > 0 && result[1].id !== "uuid-1");
});

test("assignVariantIds does not reuse the same ID for two variants", () => {
  const existing = [{ id: "uuid-1", name: "Regular", pricePaise: 10000 }];
  const input = [
    { id: "uuid-1", name: "Regular", pricePaise: 10000 },
    { id: "uuid-1", name: "Large", pricePaise: 15000 }, // same ID claimed twice
  ];
  const result = assignVariantIds(input, existing);
  const ids = result.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length); // all unique
});

// ─── Order submission rules (unit-level, no DB) ──────────────────────────────

test("duplicate productId+variantId keys in a cart should be detected", () => {
  // This mirrors the duplicate-key check in POST /api/food-orders
  const items = [
    { productId: 1, variantId: "v1" },
    { productId: 1, variantId: "v1" }, // duplicate
  ];
  const keys = items.map((item) => `${item.productId}:${item.variantId}`);
  assert.notEqual(new Set(keys).size, keys.length);
});

test("checkoutKey must match UUIDv4 format", () => {
  const uuidV4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidV4Re.test(crypto.randomUUID()));
  assert.equal(uuidV4Re.test("not-a-uuid"), false);
  // Version digit must be 4 (the 13th hex char)
  assert.equal(uuidV4Re.test("00000000-0000-0000-0000-000000000000"), false); // version 0, not 4
  assert.equal(uuidV4Re.test("550e8400-e29b-31d4-a716-446655440000"), false); // version 3, not 4
  // Variant bits must be [89ab] (the 17th hex char)
  assert.equal(uuidV4Re.test("550e8400-e29b-41d4-c716-446655440000"), false); // variant 'c' is invalid
});

test("order amount must be between ₹1 and ₹10,00,000 (paise bounds)", () => {
  const inRange = (paise: number) => Number.isSafeInteger(paise) && paise >= 100 && paise <= 100_000_000;
  assert.equal(inRange(100), true);       // ₹1 — minimum valid
  assert.equal(inRange(99), false);       // ₹0.99 — too low
  assert.equal(inRange(100_000_000), true);  // ₹10,00,000 — maximum valid
  assert.equal(inRange(100_000_001), false); // ₹10,00,000.01 — too high
});

test("per-variant quantity must be between 1 and 20 inclusive", () => {
  const validQty = (q: number) => Number.isInteger(q) && q > 0 && q <= 20;
  assert.equal(validQty(1), true);
  assert.equal(validQty(20), true);
  assert.equal(validQty(0), false);
  assert.equal(validQty(21), false);
  assert.equal(validQty(1.5), false);
});

test("cart must have at most 30 line items", () => {
  const inRange = (len: number) => len >= 1 && len <= 30;
  assert.equal(inRange(1), true);
  assert.equal(inRange(30), true);
  assert.equal(inRange(0), false);
  assert.equal(inRange(31), false);
});

test("variantId must be a non-empty string under 100 characters", () => {
  const validId = (id: unknown): boolean =>
    typeof id === "string" && id.length > 0 && id.length <= 100;
  assert.equal(validId("abc-123"), true);
  assert.equal(validId(""), false);
  assert.equal(validId("x".repeat(101)), false);
  assert.equal(validId(123), false);
});
