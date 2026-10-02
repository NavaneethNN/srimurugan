import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
if (!process.env.RAZORPAY_TEST_API_KEY?.startsWith("rzp_test_")) throw new Error("Test Razorpay keys are required");
const checkoutKey = randomUUID();
const variantId = randomUUID();
const marker = `Checkout test ${randomUUID().slice(0, 8)}`;
let productId = null;
try {
  const [category] = await sql`SELECT id FROM food_categories ORDER BY id LIMIT 1`;
  if (!category) throw new Error("No cafe category exists");
  const [product] = await sql`
    INSERT INTO food_products (category_id, name, description, image_url, variants, is_available, sort_order)
    VALUES (${category.id}, ${marker}, '', '', ${JSON.stringify([{ id: variantId, name: "Test", pricePaise: 100 }])}::jsonb, true, 99999)
    RETURNING id
  `;
  productId = product.id;
  const payload = { customerName: "Integration Test", seat: "Screen 1 T1", checkoutKey,
    items: [{ productId, variantId, quantity: 1 }] };
  const request = () => fetch("http://localhost:3100/api/food-orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }).then(async (response) => ({ status: response.status, body: await response.json() }));
  const attempts = await Promise.all(Array.from({ length: 10 }, request));
  const [saved] = await sql`SELECT id, razorpay_order_id, payment_status, amount_paise FROM food_orders WHERE checkout_key = ${checkoutKey}`;
  const retry = await request();
  const status = await fetch("http://localhost:3100/api/food-orders/status", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkoutKey }),
  }).then(async (response) => ({ status: response.status, body: await response.json() }));
  const changed = await fetch("http://localhost:3100/api/food-orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, items: [{ productId, variantId, quantity: 2 }] }),
  }).then((response) => response.status);
  const result = {
    parallelStatuses: attempts.map((attempt) => attempt.status).sort((a, b) => a - b),
    oneLocalOrder: !!saved?.id,
    providerOrderMatches: attempts.filter((attempt) => attempt.body.razorpayOrderId && attempt.body.razorpayOrderId === saved?.razorpay_order_id).length,
    retryMatches: retry.body.razorpayOrderId === saved?.razorpay_order_id,
    amountPaise: saved?.amount_paise,
    statusLookup: status.body.paymentStatus,
    changedCartStatus: changed,
  };
  console.log(JSON.stringify(result));
  if (!saved || saved.payment_status !== "created" || result.providerOrderMatches < 1 || !result.retryMatches || result.amountPaise !== 100 || result.statusLookup !== "created" || changed !== 409) process.exitCode = 1;
} finally {
  await sql`DELETE FROM food_orders WHERE checkout_key = ${checkoutKey} AND payment_status IN ('created', 'create_failed', 'creating')`;
  if (productId) await sql`DELETE FROM food_products WHERE id = ${productId} AND name = ${marker}`;
}
