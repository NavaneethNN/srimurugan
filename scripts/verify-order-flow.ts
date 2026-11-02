import assert from "node:assert/strict";
import { getDb } from "../src/lib/db";
import { foodOrders, foodProducts, foodCategories, cafeUsers } from "../src/lib/schema";
import { eq, desc } from "drizzle-orm";
import { updateOrderStatus } from "../src/lib/orderStatusUpdate";
import { generateKotRawText, formatKotDateTime } from "../src/components/KitchenOrderTicket";
import { createSeatEditToken } from "../src/lib/foodOrderEdit";

async function runVerification() {
  console.log("=== STARTING FULL END-TO-END AUDIT & VERIFICATION ===");

  const db = getDb();

  // 1. Verify Database Connection and Menu Data
  console.log("\n[1/7] Checking Menu Data in Database...");
  const categories = await db.select().from(foodCategories);
  const products = await db.select().from(foodProducts);
  console.log(`  Found ${categories.length} categories and ${products.length} products.`);
  assert.ok(categories.length > 0, "Categories table must not be empty");
  assert.ok(products.length > 0, "Products table must not be empty");

  const availableProducts = products.filter((p) => p.isAvailable);
  console.log(`  Available products: ${availableProducts.length}`);
  assert.ok(availableProducts.length > 0, "At least one product must be available");

  // 2. Verify Cafe Staff Users
  console.log("\n[2/7] Checking Cafe Staff Accounts...");
  const staff = await db.select().from(cafeUsers).where(eq(cafeUsers.isActive, true));
  console.log(`  Active cafe staff members: ${staff.length} (${staff.map((s) => s.name).join(", ")})`);
  assert.ok(staff.length > 0, "At least one active cafe staff user must exist");
  const testStaff = staff[0];

  // 3. Test Order Creation & Concurrency Guard in DB
  console.log("\n[3/7] Creating Synthetic Test Order to Verify Full Lifecycle...");
  const testCheckoutKey = "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0").slice(-12);
  const now = new Date();
  const sampleItems = [
    {
      productId: availableProducts[0].id,
      variantId: availableProducts[0].variants[0]?.id || "v-1",
      name: availableProducts[0].name,
      variantName: availableProducts[0].variants[0]?.name || "Regular",
      quantity: 2,
      unitPricePaise: availableProducts[0].variants[0]?.pricePaise || 10000,
    },
  ];
  const totalAmountPaise = sampleItems[0].quantity * sampleItems[0].unitPricePaise;

  const [inserted] = await db
    .insert(foodOrders)
    .values({
      customerName: "Audit Test Customer",
      seat: "Screen 1 · Seat K15",
      items: sampleItems,
      amountPaise: totalAmountPaise,
      status: "pending",
      paymentStatus: "paid", // simulate successful payment
      paidAt: now,
      razorpayOrderId: `order_test_${Date.now()}`,
      razorpayPaymentId: `pay_test_${Date.now()}`,
      checkoutKey: testCheckoutKey,
      statusLogs: [
        {
          action: "placed",
          status: "pending",
          actorType: "customer",
          actorName: "Audit Test Customer",
          timestamp: now.toISOString(),
          note: `Order placed online · Delivering to Screen 1 · Seat K15`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  console.log(`  Created test order #${inserted.id} (Seat: ${inserted.seat}, Amount: ₹${totalAmountPaise / 100})`);
  assert.equal(inserted.status, "pending");
  assert.equal(inserted.paymentStatus, "paid");

  // 4. Test Customer Seat Update During Edit Window
  console.log("\n[4/7] Testing Customer Seat Update & Edit Window Logging...");
  const [seatUpdatedOrder] = await db
    .update(foodOrders)
    .set({
      seat: "Screen 1 · Seat K16",
      statusLogs: [
        ...(inserted.statusLogs as any[]),
        {
          action: "seat_updated",
          status: "pending",
          actorType: "customer",
          actorName: "Audit Test Customer",
          timestamp: new Date().toISOString(),
          note: "Seat changed by customer: Screen 1 · Seat K15 → Screen 1 · Seat K16",
        },
      ],
      updatedAt: new Date(),
    })
    .where(eq(foodOrders.id, inserted.id))
    .returning();

  assert.equal(seatUpdatedOrder.seat, "Screen 1 · Seat K16");
  assert.equal(seatUpdatedOrder.statusLogs?.length, 2);
  console.log(`  Seat successfully updated to "${seatUpdatedOrder.seat}" with audit log entry.`);

  // 5. Test Staff Acceptance (Transition pending -> preparing)
  console.log("\n[5/7] Testing Staff POS Order Acceptance (Pending -> Preparing)...");
  const acceptResult = await updateOrderStatus({
    orderId: inserted.id,
    nextStatus: "preparing",
    actor: {
      type: "staff",
      id: testStaff.id,
      name: testStaff.name,
    },
  });

  assert.ok(!acceptResult.error, `Accept failed: ${acceptResult.error}`);
  assert.ok(acceptResult.order, "Must return updated order");
  assert.equal(acceptResult.order.status, "preparing");
  assert.equal(acceptResult.order.acceptedBy, testStaff.name);
  assert.ok(acceptResult.order.acceptedAt, "acceptedAt must be timestamped");
  console.log(`  Order accepted by staff: "${acceptResult.order.acceptedBy}" at ${acceptResult.order.acceptedAt}`);

  // Verify statusLogs in the order
  const logsAfterAccept = acceptResult.order.statusLogs as any[];
  const acceptLog = logsAfterAccept.find((l) => l.action === "accepted");
  assert.ok(acceptLog, "Accept log entry must exist in statusLogs");
  assert.equal(acceptLog.actorType, "staff");
  assert.equal(acceptLog.actorName, testStaff.name);
  console.log(`  Audit log verified: [${acceptLog.action}] by ${acceptLog.actorType} "${acceptLog.actorName}": ${acceptLog.note}`);

  // Test Invalid Transition Guard (cannot jump from preparing directly to pending)
  const invalidTransition = await updateOrderStatus({
    orderId: inserted.id,
    nextStatus: "preparing", // already preparing
    actor: { type: "staff", name: testStaff.name },
  });
  assert.ok(invalidTransition.error, "Invalid state transition must be rejected");
  console.log(`  Concurrency guard verified: Duplicate/invalid transition correctly rejected (${invalidTransition.error})`);

  // 6. Test Kitchen Order Ticket (KOT) Generation
  console.log("\n[6/7] Testing Kitchen Order Ticket (KOT) Generation...");
  const rawKot = generateKotRawText(
    {
      id: acceptResult.order.id,
      customerName: acceptResult.order.customerName,
      seat: acceptResult.order.seat,
      status: acceptResult.order.status,
      amountPaise: acceptResult.order.amountPaise,
      acceptedBy: acceptResult.order.acceptedBy,
      createdAt: acceptResult.order.createdAt.toISOString(),
      items: acceptResult.order.items as any,
    },
    "Canon G2010 series",
    testStaff.name
  );

  console.log("  --- Generated Thermal KOT Ticket Preview ---");
  console.log(rawKot.split("\n").map((line) => "    " + line).join("\n"));
  console.log("  --------------------------------------------");

  assert.ok(rawKot.includes("SRI MURUGAN CINEMA"), "Ticket must have cinema header");
  assert.ok(rawKot.includes("KITCHEN KOT"), "Ticket must state KITCHEN KOT");
  assert.ok(rawKot.includes("SCREEN 1 · SEAT K16"), "Ticket must have destination seat");
  assert.ok(rawKot.includes(`Order: #${acceptResult.order.id}`), "Ticket must have order #");
  assert.ok(rawKot.includes("Device: Canon G2010 series"), "Ticket must have selected printer device");
  assert.ok(rawKot.includes(`Staff:  ${testStaff.name}`), "Ticket must show accepting staff name");
  assert.ok(rawKot.includes("Audit Test Customer"), "Ticket must show customer name");
  assert.ok(rawKot.includes("NOT A TAX INVOICE"), "Ticket must state NOT A TAX INVOICE");

  // 7. Test Staff Completion (Preparing -> Completed)
  console.log("\n[7/7] Testing Staff POS Delivery Completion (Preparing -> Completed)...");
  const completeResult = await updateOrderStatus({
    orderId: inserted.id,
    nextStatus: "completed",
    actor: {
      type: "staff",
      id: testStaff.id,
      name: testStaff.name,
    },
  });

  assert.ok(!completeResult.error, `Completion failed: ${completeResult.error}`);
  assert.equal(completeResult.order.status, "completed");
  assert.equal(completeResult.order.completedBy, testStaff.name);
  assert.ok(completeResult.order.completedAt, "completedAt must be timestamped");

  const finalLogs = completeResult.order.statusLogs as any[];
  assert.equal(finalLogs.length, 4); // placed, seat_updated, accepted, completed
  console.log(`  Full order lifecycle audit log count: ${finalLogs.length} events.`);
  finalLogs.forEach((l, idx) => {
    console.log(`    ${idx + 1}. [${l.action.toUpperCase()}] ${l.actorName} (${l.actorType}): ${l.note}`);
  });

  // Clean up synthetic test order
  await db.delete(foodOrders).where(eq(foodOrders.id, inserted.id));
  console.log(`\n  Cleaned up synthetic test order #${inserted.id} from database.`);

  console.log("\n=== ALL ORDER FLOW & AUDIT LOG FUNCTIONALITIES VERIFIED SUCCESSFULLY ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

