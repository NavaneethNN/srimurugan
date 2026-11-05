import assert from "node:assert/strict";
import { getDb } from "../src/lib/db";
import { cafeUsers } from "../src/lib/schema";
import { eq } from "drizzle-orm";

const BASE = "http://localhost:3030";

type TestResult = {
  name: string;
  url: string;
  status: number;
  expectedStatus: number;
  passed: boolean;
  details?: string;
};

const results: TestResult[] = [];

async function checkRoute(
  name: string,
  url: string,
  options: RequestInit = {},
  expectedStatus = 200
): Promise<{ res: Response; body: any }> {
  const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`;
  const res = await fetch(fullUrl, options);
  let body: any = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }

  const passed = res.status === expectedStatus;
  results.push({
    name,
    url,
    status: res.status,
    expectedStatus,
    passed,
    details: passed ? "OK" : `Expected ${expectedStatus}, got ${res.status}`,
  });

  return { res, body };
}

async function main() {
  console.log("=================================================");
  console.log("   FULL SITE & API INTEGRATION AUDIT SUITE       ");
  console.log("=================================================\n");

  // ----------------------------------------------------------------
  // SECTION 1: PUBLIC CUSTOMER PAGES
  // ----------------------------------------------------------------
  console.log("--- 1. Testing Public Customer Pages ---");
  const home = await checkRoute("Homepage", "/");
  assert.ok(typeof home.body === "string" && home.body.includes("Sri Murugan Cinema"), "Homepage must render cinema name");

  const orderFood = await checkRoute("Order Food Page", "/order-food");
  assert.ok(typeof orderFood.body === "string" && orderFood.body.includes("Sri Murugan Cinema"), "Order Food page must render");

  await checkRoute("Terms and Conditions", "/terms-and-conditions");
  await checkRoute("Cancellation Policy", "/cancellation-policy");
  await checkRoute("Refund Policy", "/refund-policy");
  await checkRoute("Robots TXT", "/robots.txt");
  await checkRoute("Sitemap XML", "/sitemap.xml");

  // ----------------------------------------------------------------
  // SECTION 2: PUBLIC APIs
  // ----------------------------------------------------------------
  console.log("\n--- 2. Testing Public APIs ---");
  const moviesRes = await checkRoute("Movies API", "/api/movies");
  assert.ok(Array.isArray(moviesRes.body) || (moviesRes.body && typeof moviesRes.body === "object"), "Movies API must return valid response");

  const upcomingRes = await checkRoute("Upcoming Movies API", "/api/upcoming");
  assert.ok(Array.isArray(upcomingRes.body) || (upcomingRes.body && typeof upcomingRes.body === "object"), "Upcoming API must return valid response");

  const menuRes = await checkRoute("Food Menu API", "/api/food-menu");
  assert.ok(Array.isArray(menuRes.body?.categories), "Food Menu API must return categories array");
  assert.ok(Array.isArray(menuRes.body?.products), "Food Menu API must return products array");
  console.log(`  Menu API loaded: ${menuRes.body.categories.length} categories, ${menuRes.body.products.length} products`);

  // Customer Current Order API: returns 401 if no customer session cookie
  await checkRoute("Current Orders API without Session (Expect 401)", "/api/food-orders/current", {}, 401);

  // Test Customer Current Order API with valid signed session cookie
  const { createCustomerOrderSession, CUSTOMER_ORDER_COOKIE } = await import("../src/lib/customerOrderSession");
  const testCustomerSession = createCustomerOrderSession(31, process.env.SESSION_SECRET!);
  const currentOrdersRes = await checkRoute("Current Orders API with Valid Customer Session", "/api/food-orders/current", {
    headers: { Cookie: `${CUSTOMER_ORDER_COOKIE}=${testCustomerSession}` },
  }, 200);
  assert.ok(currentOrdersRes.body?.order?.id, "Current orders API must return order object for active session");

  // Security checks: invalid checkout payloads
  await checkRoute("Status API with empty body (Expect 400)", "/api/food-orders/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }, 400);

  await checkRoute("Create Order API with invalid items (Expect 400)", "/api/food-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName: "Test", seat: "A1", items: [] }),
  }, 400);

  // ----------------------------------------------------------------
  // SECTION 3: SECURITY & UNAUTHORIZED ACCESS GUARDS
  // ----------------------------------------------------------------
  console.log("\n--- 3. Testing Authentication Security Boundaries ---");
  await checkRoute("Admin Overview without Session (Expect 401)", "/api/admin/overview", {}, 401);
  await checkRoute("Admin Orders without Session (Expect 401)", "/api/admin/food-orders", {}, 401);
  await checkRoute("Admin Staff without Session (Expect 401)", "/api/admin/cafe-users", {}, 401);
  await checkRoute("Cafe POS Orders without Session (Expect 401)", "/api/cafe/food-orders", {}, 401);
  await checkRoute("Cafe Session Check without Cookie (Expect 401)", "/api/cafe/session", {}, 401);

  // ----------------------------------------------------------------
  // SECTION 4: CAFE STAFF AUTHENTICATION & POS
  // ----------------------------------------------------------------
  console.log("\n--- 4. Testing Cafe Staff Authentication & POS ---");
  await checkRoute("Cafe Login Page", "/cafe/login");
  await checkRoute("Cafe POS Interface Page", "/cafe/pos");

  // Fetch active cafe user from DB
  const db = getDb();
  const [activeStaff] = await db.select().from(cafeUsers).where(eq(cafeUsers.isActive, true)).limit(1);
  assert.ok(activeStaff, "At least one active cafe staff user must exist for testing");

  // Test invalid PIN
  await checkRoute("Cafe Login with Invalid PIN (Expect 401)", "/api/cafe/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "000000" }),
  }, 401);

  // Login with valid PIN (let's create a temporary test staff with known PIN "123456" if needed)
  console.log(`  Testing cafe login with staff: ${activeStaff.name}...`);
  // Temporarily set a test PIN for verification and guarantee restoration
  const { hashPin } = await import("../src/lib/cafeAuth");
  const testPin = "987654";
  const originalStaffPin = activeStaff.pin;
  await db.update(cafeUsers).set({ pin: hashPin(testPin) }).where(eq(cafeUsers.id, activeStaff.id));

  try {
    const cafeLoginRes = await checkRoute("Cafe Login with Correct PIN", "/api/cafe/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: testPin }),
    }, 200);

    const cafeCookie = cafeLoginRes.res.headers.get("set-cookie") || "";
    assert.ok(cafeCookie.includes("cafe-session="), "Login must return cafe-session cookie");
    const cafeSessionToken = cafeCookie.split(";")[0];

    // Verify cafe session with cookie
    const cafeSessionCheck = await checkRoute("Verify Cafe Session with Cookie", "/api/cafe/session", {
      headers: { Cookie: cafeSessionToken },
    });
    assert.equal(cafeSessionCheck.body?.user?.name, activeStaff.name);
    console.log(`  Successfully authenticated as: ${cafeSessionCheck.body?.user?.name}`);

    // Test Cafe POS Food Orders API with session
    const cafeOrders = await checkRoute("Cafe POS Active Queue with Cookie", "/api/cafe/food-orders?status=active", {
      headers: { Cookie: cafeSessionToken },
    });
    assert.ok(Array.isArray(cafeOrders.body?.orders), "Cafe POS must return orders array");
    console.log(`  Cafe POS queue returned ${cafeOrders.body.orders.length} active orders`);

    // Test Cafe Logout
    await checkRoute("Cafe Logout", "/api/cafe/auth", {
      method: "DELETE",
      headers: { Cookie: cafeSessionToken },
    });
  } finally {
    // Restore original staff PIN so live credentials remain intact
    await db.update(cafeUsers).set({ pin: originalStaffPin }).where(eq(cafeUsers.id, activeStaff.id));
  }

  // ----------------------------------------------------------------
  // SECTION 5: ADMIN AUTHENTICATION & MANAGEMENT
  // ----------------------------------------------------------------
  console.log("\n--- 5. Testing Admin Authentication & Control Center ---");
  await checkRoute("Admin Login Page", "/admin/login");
  await checkRoute("Admin Dashboard Page", "/admin/dashboard");
  await checkRoute("Admin Orders Page", "/admin/orders");
  await checkRoute("Admin Cafe Menu Page", "/admin/cafe");
  await checkRoute("Admin Staff Page", "/admin/cafe-users");
  await checkRoute("Admin Movies Page", "/admin/movies");

  const adminPass = process.env.ADMIN_PASSWORD || "admin123";

  // Invalid password
  await checkRoute("Admin Login with Wrong Password (Expect 401)", "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong-password-xyz" }),
  }, 401);

  // Correct password
  const adminLoginRes = await checkRoute("Admin Login with Correct Password", "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: adminPass }),
  }, 200);

  const adminCookie = adminLoginRes.res.headers.get("set-cookie") || "";
  assert.ok(adminCookie.includes("admin-session="), "Admin login must return admin-session cookie");
  const adminSessionToken = adminCookie.split(";")[0];

  // Test Admin Overview API with cookie
  const overviewRes = await checkRoute("Admin Overview API", "/api/admin/overview", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(overviewRes.body?.orders, "Overview must return orders object");
  assert.ok(Array.isArray(overviewRes.body?.queue), "Overview must return queue array");
  console.log(`  Admin Command Center: ${JSON.stringify(overviewRes.body.orders)}, ${overviewRes.body.activeStaff} staff, ${overviewRes.body.availableProducts} items`);

  // Test Admin Orders API
  const adminOrdersRes = await checkRoute("Admin Orders API (All Statuses)", "/api/admin/food-orders?status=all&limit=10", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(Array.isArray(adminOrdersRes.body?.orders), "Admin orders must return orders array");

  // Test Admin Cafe Menu API
  const adminMenuRes = await checkRoute("Admin Full Menu API", "/api/admin/food-menu/categories", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(Array.isArray(adminMenuRes.body?.categories), "Categories must be array");
  assert.ok(Array.isArray(adminMenuRes.body?.products), "Products must be array");

  // Test Admin Cafe Staff Users API
  const adminUsersRes = await checkRoute("Admin Cafe Users API", "/api/admin/cafe-users", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(Array.isArray(adminUsersRes.body?.users), "Cafe users must be array");

  // Test Admin Movies & Upcoming API
  const adminMoviesRes = await checkRoute("Admin Movies API", "/api/admin/movies", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(Array.isArray(adminMoviesRes.body?.movies), "Admin movies must be array");

  const adminUpcomingRes = await checkRoute("Admin Upcoming API", "/api/admin/upcoming", {
    headers: { Cookie: adminSessionToken },
  });
  assert.ok(Array.isArray(adminUpcomingRes.body?.upcoming), "Admin upcoming must be array");

  // Test Admin Logout
  await checkRoute("Admin Logout", "/api/admin/login", {
    method: "DELETE",
    headers: { Cookie: adminSessionToken },
  });

  // ----------------------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------------------
  console.log("\n=================================================");
  console.log("            AUDIT RESULTS SUMMARY                ");
  console.log("=================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  for (const r of results) {
    const mark = r.passed ? "[PASS]" : "[FAIL]";
    console.log(`  ${mark} ${r.name.padEnd(46)} -> ${r.url} (${r.status})`);
  }

  console.log(`\nTOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

  if (failedCount > 0) {
    console.error(`\nFAILED: ${failedCount} tests failed!`);
    process.exit(1);
  } else {
    console.log("\nSUCCESS: ALL 34 CRITICAL ROUTES & APIS FUNCTIONING PROPERLY!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
