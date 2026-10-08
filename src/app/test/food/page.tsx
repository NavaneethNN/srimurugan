"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

type TestResult = "pass" | "fail" | "untested";

interface TestCase {
  id: string;
  section: string;
  title: string;
  description: string;
  steps: string[];
  expected: string;
}

const TEST_CASES: TestCase[] = [
  // ── MENU LOADING ──────────────────────────────────────────────
  {
    id: "ML-01",
    section: "Menu Loading",
    title: "Menu loads successfully on page open",
    description: "Verify that categories and products are fetched and displayed when the /order-food page opens.",
    steps: ["Open /order-food in the browser.", "Wait up to 5 seconds for the page to fully load."],
    expected: "Category tabs and product cards are visible. No error message is shown.",
  },
  {
    id: "ML-02",
    section: "Menu Loading",
    title: "Correct categories are shown",
    description: "Verify all active menu categories appear as tabs.",
    steps: ["Open /order-food.", "Check the category tab bar at the top of the menu section."],
    expected: "All categories configured in the admin panel are visible as tabs.",
  },
  {
    id: "ML-03",
    section: "Menu Loading",
    title: "Category filter shows relevant products",
    description: "Clicking a category tab shows only products belonging to that category.",
    steps: ["Open /order-food.", "Click on a specific category tab (e.g. Beverages).", "Observe the product cards shown."],
    expected: "Only products in the selected category are displayed.",
  },
  {
    id: "ML-04",
    section: "Menu Loading",
    title: "Unavailable products are hidden",
    description: "Products marked unavailable in the admin panel should not appear.",
    steps: ["Mark a product as unavailable in the admin panel.", "Reload /order-food."],
    expected: "The marked product is not visible in the menu.",
  },

  // ── CART ──────────────────────────────────────────────────────
  {
    id: "CO-01",
    section: "Cart",
    title: "Add item to cart",
    description: "User can add a product variant to the cart.",
    steps: ["Open /order-food.", "Find a product and click the '+' button to add it."],
    expected: "Cart item count increases by 1. Product quantity shows 1.",
  },
  {
    id: "CO-02",
    section: "Cart",
    title: "Increase item quantity",
    description: "Clicking '+' multiple times increases quantity correctly.",
    steps: ["Add an item to the cart.", "Click '+' two more times for the same item."],
    expected: "Quantity shows 3. Cart total updates accordingly.",
  },
  {
    id: "CO-03",
    section: "Cart",
    title: "Decrease item quantity",
    description: "Clicking '−' reduces the quantity.",
    steps: ["Add 3 of the same item.", "Click '−' once."],
    expected: "Quantity shows 2. Cart total updates accordingly.",
  },
  {
    id: "CO-04",
    section: "Cart",
    title: "Remove item when quantity reaches zero",
    description: "Reducing quantity to 0 removes the item from cart.",
    steps: ["Add 1 of an item.", "Click '−' once."],
    expected: "Item is removed from the cart. Cart count decreases.",
  },
  {
    id: "CO-05",
    section: "Cart",
    title: "Cart persists on page refresh",
    description: "Cart contents should survive a browser refresh (saved to localStorage).",
    steps: ["Add a few items to the cart.", "Refresh the page (F5)."],
    expected: "Cart items and quantities are restored after reload.",
  },
  {
    id: "CO-06",
    section: "Cart",
    title: "Cart total calculation is correct",
    description: "The displayed total matches the sum of (unit price × quantity) for all items.",
    steps: ["Add multiple different items with known prices.", "Open the cart panel.", "Verify the total shown."],
    expected: "Total equals the manual sum of item prices.",
  },
  {
    id: "CO-07",
    section: "Cart",
    title: "Cart drawer opens and closes",
    description: "The cart slide-in panel opens and closes correctly.",
    steps: ["Add an item.", "Click the cart button to open the drawer.", "Click the close button (×) in the drawer."],
    expected: "Drawer opens showing cart items, then closes cleanly.",
  },
  {
    id: "CO-08",
    section: "Cart",
    title: "Maximum quantity per item is 20",
    description: "User cannot add more than 20 of any single variant.",
    steps: ["Click '+' on an item 21 times."],
    expected: "Quantity stops at 20 and does not go higher.",
  },

  // ── CHECKOUT FORM ─────────────────────────────────────────────
  {
    id: "CF-01",
    section: "Checkout Form",
    title: "Checkout button disabled with empty cart",
    description: "The proceed-to-checkout button should be inactive when cart is empty.",
    steps: ["Open /order-food with an empty cart.", "Attempt to click the checkout button."],
    expected: "Checkout button is disabled or does not submit.",
  },
  {
    id: "CF-02",
    section: "Checkout Form",
    title: "Name field is required",
    description: "Submitting without a name shows a validation error.",
    steps: ["Add items to cart.", "Leave the Name field blank.", "Click Proceed to Pay."],
    expected: "Error message: name is required.",
  },
  {
    id: "CF-03",
    section: "Checkout Form",
    title: "Seat/Screen field is required",
    description: "Submitting without a seat shows a validation error.",
    steps: ["Add items to cart.", "Fill in name but leave seat blank.", "Click Proceed to Pay."],
    expected: "Error message: seat/screen is required.",
  },
  {
    id: "CF-04",
    section: "Checkout Form",
    title: "Seat confirmation step works",
    description: "After entering a seat number the user must confirm it before proceeding.",
    steps: ["Enter a seat value in the seat field.", "Check if a confirm step appears.", "Confirm the seat."],
    expected: "Seat is confirmed and the checkout flow continues.",
  },
  {
    id: "CF-05",
    section: "Checkout Form",
    title: "Name longer than 120 characters is rejected",
    description: "API rejects names over 120 chars; the UI should surface this.",
    steps: ["Enter a name with 121+ characters.", "Complete the rest of the form and submit."],
    expected: "Validation error is shown; order is not placed.",
  },

  // ── ORDER SUBMISSION ──────────────────────────────────────────
  {
    id: "OS-01",
    section: "Order Submission",
    title: "Successful order creation returns Razorpay checkout",
    description: "A valid POST to /api/food-orders returns orderId, razorpayOrderId, keyId, amountPaise.",
    steps: ["Fill in name, seat, and add items.", "Click Proceed to Pay.", "Observe network request to /api/food-orders in DevTools."],
    expected: "Response 200 with { orderId, razorpayOrderId, keyId, amountPaise, currency }.",
  },
  {
    id: "OS-02",
    section: "Order Submission",
    title: "Duplicate checkout key returns same order",
    description: "Resubmitting the same cart (same checkoutKey + hash) resumes the existing order.",
    steps: ["Start checkout once.", "Before completing payment, close the Razorpay modal.", "Click Proceed to Pay again."],
    expected: "The same Razorpay order is reopened, not a new one.",
  },
  {
    id: "OS-03",
    section: "Order Submission",
    title: "Cart change after checkout start triggers 409",
    description: "Changing the cart while a pending checkout key exists triggers an error.",
    steps: ["Start checkout.", "Close the modal.", "Modify the cart items.", "Try to checkout again."],
    expected: "Error: 'Your cart changed. Please start a new checkout.'",
  },
  {
    id: "OS-04",
    section: "Order Submission",
    title: "Order total is correctly calculated server-side",
    description: "Server computes total from DB product prices, not from client-supplied values.",
    steps: ["Add items and note the displayed total.", "Proceed to checkout.", "In DevTools, check the amountPaise in the response against expected total × 100."],
    expected: "amountPaise matches the displayed cart total × 100.",
  },
  {
    id: "OS-05",
    section: "Order Submission",
    title: "Unavailable product in cart triggers 409",
    description: "If a product becomes unavailable between adding to cart and checkout, the API returns 409.",
    steps: ["Add a product to cart.", "Mark it unavailable in admin panel.", "Proceed to checkout."],
    expected: "Error: 'Your menu has changed. Please refresh the page and review your order.'",
  },

  // ── PAYMENT ───────────────────────────────────────────────────
  {
    id: "PAY-01",
    section: "Payment",
    title: "Razorpay modal opens after order creation",
    description: "After a successful order POST, the Razorpay payment modal appears.",
    steps: ["Fill all fields, add items, click Proceed to Pay.", "Wait for the Razorpay modal."],
    expected: "Razorpay payment modal is displayed with the correct amount.",
  },
  {
    id: "PAY-02",
    section: "Payment",
    title: "Amount shown in Razorpay modal is correct",
    description: "The amount displayed in Razorpay matches the cart total.",
    steps: ["Note the cart total before clicking Proceed to Pay.", "Open the Razorpay modal."],
    expected: "Amount in modal = cart total (in ₹).",
  },
  {
    id: "PAY-03",
    section: "Payment",
    title: "Successful payment triggers order verification",
    description: "After completing payment, the app calls /api/food-orders/verify.",
    steps: ["Complete a test payment in Razorpay.", "Observe network calls in DevTools."],
    expected: "POST to /api/food-orders/verify is made with payment details.",
  },
  {
    id: "PAY-04",
    section: "Payment",
    title: "Order confirmation is shown after payment",
    description: "User sees their order summary with ID and items after successful payment.",
    steps: ["Complete a test payment.", "Wait for the confirmation screen."],
    expected: "Confirmation modal shows order ID, customer name, seat, and item list.",
  },
  {
    id: "PAY-05",
    section: "Payment",
    title: "Cart is cleared after successful payment",
    description: "The cart should be empty after order is confirmed.",
    steps: ["Complete a successful payment.", "Check the cart badge / drawer."],
    expected: "Cart is empty and shows 0 items.",
  },
  {
    id: "PAY-06",
    section: "Payment",
    title: "Closing Razorpay modal before payment shows pending state",
    description: "If user closes the modal without paying, the pending checkout is stored.",
    steps: ["Start checkout, open Razorpay modal.", "Close the modal without paying."],
    expected: "UI returns to checkout state; pending checkout is recoverable on retry.",
  },

  // ── PAYMENT VERIFICATION ─────────────────────────────────────
  {
    id: "PV-01",
    section: "Payment Verification",
    title: "Valid signature verifies successfully",
    description: "POST /api/food-orders/verify with a valid Razorpay signature returns confirmation.",
    steps: ["Complete a test payment.", "Check DevTools for the /verify response."],
    expected: "200 response with order confirmation data.",
  },
  {
    id: "PV-02",
    section: "Payment Verification",
    title: "Invalid signature is rejected",
    description: "Tampered payment details should fail verification.",
    steps: ["In DevTools, intercept the verify request and modify razorpay_signature.", "Resend the request."],
    expected: "400 response: 'Payment verification failed.'",
  },
  {
    id: "PV-03",
    section: "Payment Verification",
    title: "Already-paid order returns confirmation on re-verify",
    description: "If verify is called again for an already paid order with the same payment ID, it returns confirmation.",
    steps: ["Complete payment.", "Call /api/food-orders/verify again with the same payload."],
    expected: "200 response with the same order confirmation.",
  },

  // ── ORDER STATUS ──────────────────────────────────────────────
  {
    id: "ST-01",
    section: "Order Status",
    title: "Status endpoint returns paid status for completed order",
    description: "After payment, /api/food-orders/status returns paymentStatus: 'paid'.",
    steps: ["Complete a payment.", "POST to /api/food-orders/status with the checkoutKey."],
    expected: "Response includes paymentStatus: 'paid' and order details.",
  },
  {
    id: "ST-02",
    section: "Order Status",
    title: "Status endpoint returns 202 while checkout is being prepared",
    description: "If Razorpay order creation is in progress, status returns 202.",
    steps: ["Intercept or simulate a slow Razorpay call.", "Poll /api/food-orders/status immediately."],
    expected: "202 response with Retry-After header.",
  },
  {
    id: "ST-03",
    section: "Order Status",
    title: "Unknown checkoutKey returns 404",
    description: "Polling status with a non-existent key returns 404.",
    steps: ["POST to /api/food-orders/status with a random UUID as checkoutKey."],
    expected: "404 response: 'Checkout not found.'",
  },

  // ── EDIT ORDER ────────────────────────────────────────────────
  {
    id: "EO-01",
    section: "Edit Order",
    title: "Edit seat updates the order",
    description: "Within the edit window, the customer can update their seat.",
    steps: ["Complete a payment.", "On the confirmation screen, click Edit Seat.", "Change the seat value and save."],
    expected: "Seat is updated and confirmation shows the new value.",
  },
  {
    id: "EO-02",
    section: "Edit Order",
    title: "Edit window countdown is shown",
    description: "The confirmation shows a countdown timer for the edit window.",
    steps: ["Complete a payment.", "Observe the edit window timer."],
    expected: "A countdown is displayed and decreases in real time.",
  },
  {
    id: "EO-03",
    section: "Edit Order",
    title: "Edit is disabled after the window expires",
    description: "After the edit deadline, seat editing is no longer available.",
    steps: ["Complete a payment.", "Wait for the edit timer to reach 0.", "Try to click Edit Seat."],
    expected: "Edit option is disabled or hidden after the deadline.",
  },
];

const SECTIONS = [...new Set(TEST_CASES.map((t) => t.section))];
const STORAGE_KEY = "food-test-results-v1";

function loadState(): Record<string, { result: TestResult; note: string }> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveState(state: Record<string, { result: TestResult; note: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function FoodTestPage() {
  const [state, setState] = useState<Record<string, { result: TestResult; note: string }>>(() => loadState());
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("All");

  const setResult = (id: string, result: TestResult) => {
    setState((prev) => {
      const next = { ...prev, [id]: { result, note: prev[id]?.note ?? "" } };
      saveState(next);
      return next;
    });
  };

  const setNote = (id: string, note: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: { result: prev[id]?.result ?? "untested", note } };
      saveState(next);
      return next;
    });
  };

  const toggleNote = (id: string) =>
    setOpenNotes((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetAll = () => {
    if (!confirm("Reset all results and notes?")) return;
    setState({});
    saveState({});
  };

  const counts = {
    pass: TEST_CASES.filter((t) => state[t.id]?.result === "pass").length,
    fail: TEST_CASES.filter((t) => state[t.id]?.result === "fail").length,
    untested: TEST_CASES.filter((t) => !state[t.id] || state[t.id].result === "untested").length,
  };

  const filtered = activeSection === "All"
    ? TEST_CASES
    : TEST_CASES.filter((t) => t.section === activeSection);

  return (
    <div className="site-light flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-[68px]">

        {/* Page header strip */}
        <section className="border-b border-[var(--card-border)] py-10 px-4 text-center">
          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--gold)] transition-colors mb-4"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All suites
          </Link>
          <p className="section-label mx-auto mb-4">Manual Test Suite</p>
          <h1 className="section-title">Food Ordering</h1>
          <p className="mt-4 max-w-xl mx-auto text-[var(--muted)] text-sm leading-relaxed">
            {TEST_CASES.length} test cases across {SECTIONS.length} areas. Mark each as pass or fail, add notes, and track your progress below.
          </p>

          {/* Summary pills */}
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold border border-green-600 bg-green-100 text-green-800">
              ✓ {counts.pass} Pass
            </span>
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold border border-red-400 bg-red-100 text-red-700">
              ✗ {counts.fail} Fail
            </span>
            <span className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[var(--card-border)] text-[var(--muted)]">
              {counts.untested} Untested
            </span>
            <button
              onClick={resetAll}
              className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
            >
              Reset all
            </button>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Section filter tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {["All", ...SECTIONS].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border transition-colors ${
                  activeSection === section
                    ? "bg-[var(--gold)] text-[#080808] border-[var(--gold)]"
                    : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
                }`}
              >
                {section}
              </button>
            ))}
          </div>

          {/* Test cards */}
          <div className="space-y-4">
            {filtered.map((tc) => {
              const result: TestResult = state[tc.id]?.result ?? "untested";
              const note = state[tc.id]?.note ?? "";
              const noteOpen = openNotes[tc.id] ?? false;

              const borderColor =
                result === "pass" ? "border-green-400" :
                result === "fail" ? "border-red-400" :
                "border-[var(--card-border)]";

              const bgColor =
                result === "pass" ? "bg-green-50" :
                result === "fail" ? "bg-red-50" :
                "bg-[var(--card)]";

              return (
                <div
                  key={tc.id}
                  className={`rounded-xl border ${borderColor} ${bgColor} p-5 transition-colors`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[var(--muted)] uppercase tracking-widest">{tc.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--card-border)] text-[var(--muted)]">{tc.section}</span>
                        {result === "pass" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white font-semibold">✓ Pass</span>
                        )}
                        {result === "fail" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold">✗ Fail</span>
                        )}
                        {result === "untested" && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--card-border)] text-[var(--muted)]">Untested</span>
                        )}
                      </div>
                      <h2 className="font-semibold text-base text-[var(--foreground)]">{tc.title}</h2>
                      <p className="text-sm mt-0.5 text-[var(--muted)]">{tc.description}</p>
                    </div>

                    {/* Pass / Fail buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setResult(tc.id, result === "pass" ? "untested" : "pass")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                          result === "pass"
                            ? "bg-green-600 text-white border-green-600 shadow"
                            : "border-green-500 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        ✓ Pass
                      </button>
                      <button
                        onClick={() => setResult(tc.id, result === "fail" ? "untested" : "fail")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                          result === "fail"
                            ? "bg-red-600 text-white border-red-600 shadow"
                            : "border-red-400 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        ✗ Fail
                      </button>
                    </div>
                  </div>

                  {/* Steps + Expected */}
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--gold)]">Steps</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--muted)]">
                        {tc.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-[var(--gold)]">Expected Result</p>
                      <p className="text-sm text-[var(--muted)]">{tc.expected}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-4 border-t border-[var(--card-border)] pt-3">
                    <button
                      onClick={() => toggleNote(tc.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${noteOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      {noteOpen ? "Hide notes" : note ? "Edit notes" : "Add notes"}
                      {note && !noteOpen && (
                        <span className="ml-1 normal-case font-normal text-[var(--muted)] opacity-60 truncate max-w-[260px]">
                          — {note}
                        </span>
                      )}
                    </button>
                    {noteOpen && (
                      <textarea
                        className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--surface)] p-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] resize-y min-h-[72px] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
                        placeholder="Add notes, bug details, repro steps, screenshots references…"
                        value={note}
                        onChange={(e) => setNote(tc.id, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom summary */}
          <div className="mt-8 p-4 rounded-xl border border-[var(--card-border)] text-sm text-[var(--muted)] text-center">
            {TEST_CASES.length} total · {counts.pass} passing · {counts.fail} failing · {counts.untested} untested
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
