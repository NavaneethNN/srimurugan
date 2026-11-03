"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type FoodCategory, type FoodOrderItem, type FoodProduct } from "@/lib/foodMenu";
import { recommendAddOns, recommendVariantUpgrade } from "@/lib/foodRecommendations";
import { lockBodyScroll, unlockBodyScroll, forceUnlockBodyScroll } from "@/lib/scrollLock";

type Status = "idle" | "submitting" | "paying" | "verifying" | "error";
type CartLine = { product: FoodProduct; variant: FoodProduct["variants"][number]; quantity: number; key: string };
type Confirmation = {
  id: number;
  status: string;
  customerName: string;
  seat: string;
  items: FoodOrderItem[];
  editToken: string;
  editDeadline: number;
  editWindowMs: number;
};
type ConfirmationPayload = {
  order: { id: number; status: string; customerName: string; seat: string; items: FoodOrderItem[] };
  editToken: string;
  editRemainingMs: number;
  editWindowMs: number;
};

const orderStatusText: Record<string, string> = {
  pending: "Received by cafe staff",
  preparing: "Freshly preparing in kitchen",
  completed: "Delivered to your seat",
  cancelled: "Order cancelled",
};

const orderStatusSteps = ["pending", "preparing", "completed"];

function confirmationFrom(result: ConfirmationPayload, receivedAt: number): Confirmation {
  return {
    id: result.order.id,
    status: result.order.status,
    customerName: result.order.customerName,
    seat: result.order.seat,
    items: result.order.items,
    editToken: result.editToken,
    editDeadline: receivedAt + result.editRemainingMs,
    editWindowMs: result.editWindowMs,
  };
}

const storageKey = "srimurugan-food-cart-v2";
const lineKey = (productId: number, variantId: string) => `${productId}:${variantId}`;
const currentTime = () => Date.now();

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type PendingPayment = { orderId: number; payment: RazorpayResponse };
const pendingPaymentKey = "srimurugan-pending-payment-v1";
type CheckoutDetails = { orderId: number; razorpayOrderId: string; keyId: string; amountPaise: number; currency: string };
type PendingCheckout = {
  checkoutKey: string;
  payload: { customerName: string; seat: string; items: { productId: number; variantId: string; quantity: number }[] };
  checkout?: CheckoutDetails;
  createdAt?: number;
};
const pendingCheckoutKey = "srimurugan-pending-checkout-v1";
const customerProfileKey = "srimurugan-customer-profile-v1";

type RazorpayCheckout = { open: () => void; on: (event: string, callback: (response: unknown) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout;
let checkoutScriptPromise: Promise<RazorpayConstructor> | null = null;

function loadRazorpayCheckout() {
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      const constructor = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (constructor) resolve(constructor);
      else reject(new Error("Payment checkout could not load. Please try again."));
    };
    script.onerror = () => reject(new Error("Payment checkout could not load. Please try again."));
    document.head.appendChild(script);
  }).catch((error) => {
    checkoutScriptPromise = null;
    throw error;
  });
  return checkoutScriptPromise;
}

function keepFocusInside(event: KeyboardEvent, dialogLabel: string) {
  if (event.key !== "Tab") return;
  const dialog = document.querySelector<HTMLElement>(`[aria-labelledby="${dialogLabel}"]`);
  const focusable = dialog?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
  );
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function isProductVeg(product: FoodProduct): boolean {
  const text = `${product.name} ${product.description}`.toLowerCase();
  return !/chicken|egg|tikka|meat|fish|nugget/.test(text);
}

function ProductImage({ product, sizes }: { product: FoodProduct; sizes: string }) {
  return product.imageUrl ? (
    <Image
      src={product.imageUrl}
      alt={product.name}
      fill
      sizes={sizes}
      unoptimized={product.imageUrl.startsWith("https://")}
      className="object-cover transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#f0e2cb] text-gold" aria-label={product.name}>
      <svg className="h-8 w-8 text-gold/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
        <path d="M15 2v19" />
        <path d="M6 2v7a3 3 0 0 0 6 0V2" />
        <path d="M9 2v19" />
      </svg>
    </div>
  );
}

export default function OrderFood() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  // activeCategory null means "All"
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartReady, setCartReady] = useState(false);

  // Customer & Seating details
  const [name, setName] = useState("");
  const [seat, setSeat] = useState("");
  const [seatConfirmed, setSeatConfirmed] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [editingSeat, setEditingSeat] = useState(false);
  const [seatDraft, setSeatDraft] = useState("");
  const [seatError, setSeatError] = useState("");
  const [savingSeat, setSavingSeat] = useState(false);
  const [now, setNow] = useState(0);

  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const cartCloseRef = useRef<HTMLButtonElement>(null);
  const confirmationCloseRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);

  const searchInputId = useId();

  // Ensure body scroll is never stuck when visiting or leaving food ordering
  useEffect(() => {
    forceUnlockBodyScroll();
    return () => {
      forceUnlockBodyScroll();
    };
  }, []);

  // Restore saved profile & pending states
  useEffect(() => {
    try {
      const savedProfile = JSON.parse(localStorage.getItem(customerProfileKey) || "{}");
      if (savedProfile.name && typeof savedProfile.name === "string") setName(savedProfile.name);
      if (savedProfile.seat && typeof savedProfile.seat === "string") setSeat(savedProfile.seat);
    } catch {
      // Profile storage optional
    }

    try {
      const saved = JSON.parse(localStorage.getItem(pendingPaymentKey) || "null") as PendingPayment | null;
      if (
        saved &&
        Number.isSafeInteger(saved.orderId) &&
        saved.orderId >= 1 &&
        typeof saved.payment?.razorpay_payment_id === "string" &&
        /^pay_[A-Za-z0-9]+$/.test(saved.payment.razorpay_payment_id)
      ) {
        setPendingPayment(saved);
      } else if (saved) {
        try {
          localStorage.removeItem(pendingPaymentKey);
        } catch {
          /* Storage optional */
        }
      }
    } catch {
      /* Payment recovery optional */
    }

    try {
      const savedCheckout = JSON.parse(localStorage.getItem(pendingCheckoutKey) || "null") as PendingCheckout | null;
      // Stale or legacy checkouts without createdAt or checkouts older than 45 minutes should not block user
      const isExpired = !savedCheckout?.createdAt || (Date.now() - savedCheckout.createdAt > 45 * 60 * 1000);
      if (
        savedCheckout &&
        !isExpired &&
        typeof savedCheckout.checkoutKey === "string" &&
        savedCheckout.payload?.customerName &&
        savedCheckout.payload?.seat
      ) {
        setPendingCheckout(savedCheckout);
        setName(savedCheckout.payload.customerName);
        setSeat(savedCheckout.payload.seat);
      } else if (savedCheckout) {
        // Clean up stale or expired checkout from localStorage so it never blocks the user
        try {
          localStorage.removeItem(pendingCheckoutKey);
        } catch {
          /* optional */
        }
      }
    } catch {
      /* Checkout recovery optional */
    }
  }, []);

  // Poll active order
  useEffect(() => {
    let cancelled = false;
    async function refreshOrderStatus() {
      try {
        const response = await fetch("/api/food-orders/current", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as ConfirmationPayload;
        if (cancelled) return;
        const receivedAt = currentTime();
        setNow(receivedAt);
        setConfirmation((current) => {
          if (current && current.id > result.order.id) return current;
          if (!current || current.id !== result.order.id) return confirmationFrom(result, receivedAt);
          if (current.status === result.order.status && current.seat === result.order.seat) return current;
          return { ...current, status: result.order.status, seat: result.order.seat, items: result.order.items };
        });
      } catch {
        /* Keep last known */
      }
    }
    void refreshOrderStatus();
    const interval = confirmation?.id ? window.setInterval(() => void refreshOrderStatus(), 5_000) : null;
    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
    };
  }, [confirmation?.id]);

  // Load food menu
  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      try {
        const response = await fetch("/api/food-menu", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load the menu.");
        if (cancelled) return;
        setCategories(data.categories || []);
        setProducts(data.products || []);
        // By default show "All" (null), or first category if preferred
        setActiveCategory(null);
        let saved: Record<string, number> = {};
        try {
          saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        } catch {
          /* Cart storage optional */
        }
        const valid = new Set<string>();
        for (const prod of data.products as FoodProduct[]) {
          for (const variant of prod.variants) {
            if (variant.pricePaise !== null && variant.pricePaise > 0) {
              valid.add(lineKey(prod.id, variant.id));
            }
          }
        }
        const restored: Record<string, number> = {};
        for (const [key, quantity] of Object.entries(saved)) {
          if (valid.has(key) && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) {
            restored[key] = quantity;
          }
        }
        setQuantities(restored);
        setCartReady(true);
      } catch (cause) {
        if (!cancelled) setMenuError(cause instanceof Error ? cause.message : "Unable to load the menu.");
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }
    void loadMenu();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync cart to localStorage and broadcast event
  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(quantities));
      window.dispatchEvent(new Event("storage"));
      const totalCount = Object.values(quantities).reduce((acc, q) => acc + q, 0);
      window.dispatchEvent(new CustomEvent("srimurugan-cart-updated", { detail: totalCount }));
    } catch {
      /* Storage optional */
    }
  }, [quantities, cartReady]);

  // Persist customer name and seat
  useEffect(() => {
    if (!name && !seat) return;
    try {
      localStorage.setItem(customerProfileKey, JSON.stringify({ name: name.trim(), seat: seat.trim() }));
    } catch {
      /* Storage optional */
    }
  }, [name, seat]);

  // Accessibility: Cart modal escape & focus trap
  useEffect(() => {
    if (!cartOpen) return;
    lockBodyScroll();
    const returnFocus = cartButtonRef.current;

    cartCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
      keepFocusInside(event, "mobile-cart-title");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKeyDown);
      returnFocus?.focus();
    };
  }, [cartOpen]);

  // Seat edit countdown timer
  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setInterval(() => {
      setNow(currentTime());
      if (currentTime() >= confirmation.editDeadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [confirmation]);

  // Confirmation dialog escape & focus trap
  useEffect(() => {
    if (!confirmationOpen) return;
    lockBodyScroll();

    confirmationCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmationOpen(false);
      keepFocusInside(event, "order-confirmation-title");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmationOpen]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      // Category match
      if (activeCategory !== null && product.categoryId !== activeCategory) {
        return false;
      }
      // Dietary match
      if (dietaryFilter === "veg" && !isProductVeg(product)) return false;
      if (dietaryFilter === "non-veg" && isProductVeg(product)) return false;
      // Search match
      if (query) {
        const matchName = product.name.toLowerCase().includes(query);
        const matchDesc = product.description.toLowerCase().includes(query);
        const matchTag = (product.tag || "").toLowerCase().includes(query);
        const matchVariant = product.variants.some((v) => v.name.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchTag && !matchVariant) {
          return false;
        }
      }
      return true;
    });
  }, [products, activeCategory, dietaryFilter, searchQuery]);

  const lines: CartLine[] = products.flatMap((product) =>
    product.variants.flatMap((variant) => {
      const key = lineKey(product.id, variant.id);
      const quantity = quantities[key] || 0;
      return quantity > 0 ? [{ product, variant, quantity, key }] : [];
    })
  );

  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const knownTotalPaise = lines.reduce((total, line) => total + (line.variant.pricePaise || 0) * line.quantity, 0);
  const hasUnpricedItems = lines.some((line) => line.variant.pricePaise === null || line.variant.pricePaise <= 0);
  const suggestions = recommendAddOns(
    categories,
    products,
    lines.map((line) => ({ productId: line.product.id, variantId: line.variant.id })),
    knownTotalPaise
  );
  const upgrade = recommendVariantUpgrade(
    products,
    lines.map((line) => ({ productId: line.product.id, variantId: line.variant.id, quantity: line.quantity })),
    knownTotalPaise
  );
  const secondsLeft = confirmation ? Math.max(0, Math.ceil((confirmation.editDeadline - now) / 1000)) : 0;

  function changeQuantity(productId: number, variantId: string, change: number) {
    const key = lineKey(productId, variantId);
    setStatus("idle");
    setQuantities((current) => {
      const newQty = Math.max(0, Math.min(20, (current[key] || 0) + change));
      const next = { ...current, [key]: newQty };
      if (newQty === 0) delete next[key];
      return next;
    });
  }

  function clearCart() {
    setStatus("idle");
    setQuantities({});
  }

  function applyUpgrade(productId: number, fromId: string, toId: string) {
    setStatus("idle");
    setQuantities((current) => ({
      ...current,
      [lineKey(productId, toId)]: current[lineKey(productId, fromId)] || 1,
      [lineKey(productId, fromId)]: 0,
    }));
  }

  function showConfirmation(result: ConfirmationPayload) {
    const receivedAt = currentTime();
    setConfirmation(confirmationFrom(result, receivedAt));
    setNow(receivedAt);
    setSeatDraft(result.order.seat);
    setEditingSeat(false);
    setSeatError("");
    setQuantities({});
    setSeatConfirmed(false);
    setCartOpen(false);
    setConfirmationOpen(true);
    setStatus("idle");
    setPendingPayment(null);
    try {
      localStorage.removeItem(pendingPaymentKey);
    } catch {
      /* optional */
    }
    setPendingCheckout(null);
    try {
      localStorage.removeItem(pendingCheckoutKey);
    } catch {
      /* optional */
    }
    submittingRef.current = false;
  }

  async function confirmPayment(pending: PendingPayment) {
    setPendingPayment(pending);
    try {
      localStorage.setItem(pendingPaymentKey, JSON.stringify(pending));
    } catch {
      /* optional */
    }
    setStatus("verifying");
    setError("");
    try {
      const verification = await fetch("/api/food-orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pending.orderId, ...pending.payment }),
      });
      const verified = await verification.json();
      if (!verification.ok) throw new Error(verified.error || "Payment confirmation is delayed.");
      showConfirmation(verified);
    } catch (cause) {
      setError(
        `${
          cause instanceof Error ? cause.message : "Payment confirmation is delayed."
        } Payment ID: ${pending.payment.razorpay_payment_id}. Please do not pay again.`
      );
      setStatus("error");
      submittingRef.current = false;
    }
  }

  function savePendingCheckout(attempt: PendingCheckout) {
    const withTimestamp = { ...attempt, createdAt: attempt.createdAt || Date.now() };
    setPendingCheckout(withTimestamp);
    try {
      localStorage.setItem(pendingCheckoutKey, JSON.stringify(withTimestamp));
    } catch {
      /* optional */
    }
  }

  async function checkoutStatus(attempt: PendingCheckout): Promise<CheckoutDetails | "paid" | null> {
    const response = await fetch("/api/food-orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutKey: attempt.checkoutKey }),
    });
    const result = await response.json();
    if (response.status === 404) return null;
    if (response.status === 410 || result.expired || result.cancelled) {
      setPendingCheckout(null);
      try {
        localStorage.removeItem(pendingCheckoutKey);
      } catch {
        /* optional */
      }
      throw new Error(result.error || "Earlier checkout expired. Please start a fresh order.");
    }
    if (response.status === 202) throw new Error("Checkout is still being prepared. Please retry in a moment.");
    if (!response.ok) throw new Error(result.error || "Could not check payment status.");
    if (result.paymentStatus === "paid") {
      showConfirmation(result);
      return "paid";
    }
    return result as CheckoutDetails;
  }

  async function openCheckout(details: CheckoutDetails, customerName: string) {
    const Razorpay = await loadRazorpayCheckout();
    let paymentCallbackStarted = false;
    let paymentFailed = false;
    const checkout = new Razorpay({
      key: details.keyId,
      amount: details.amountPaise,
      currency: details.currency,
      name: "Sri Murugan Cinema",
      description: `Cafe order #${details.orderId}`,
      order_id: details.razorpayOrderId,
      prefill: { name: customerName },
      theme: { color: "#ae7820" },
      handler: async (payment: RazorpayResponse) => {
        paymentCallbackStarted = true;
        await confirmPayment({ orderId: details.orderId, payment });
      },
      modal: {
        ondismiss: () => {
          if (!paymentCallbackStarted && !paymentFailed) {
            setError("Checkout closed. Check payment status before trying again.");
            setStatus("error");
            submittingRef.current = false;
          }
        },
      },
    });
    checkout.on("payment.failed", () => {
      paymentFailed = true;
      submittingRef.current = false;
      setError("Payment failed. Retry in checkout or check payment status before trying again.");
      setStatus("error");
    });
    setStatus("paying");
    checkout.open();
  }

  async function resumeCheckout() {
    if (!pendingCheckout || submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    setError("");
    try {
      let details = await checkoutStatus(pendingCheckout);
      if (details === "paid") return;
      if (!details && !pendingCheckout.checkout) {
        const response = await fetch("/api/food-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingCheckout.payload, checkoutKey: pendingCheckout.checkoutKey }),
        });
        const result = await response.json();
        if (response.status === 202) throw new Error("Checkout is still being prepared. Please retry in a moment.");
        if (!response.ok) throw new Error(result.error || "Please try again.");
        details = result as CheckoutDetails;
      }
      if (!details) {
        submittingRef.current = false;
        return;
      }
      savePendingCheckout({ ...pendingCheckout, checkout: details });
      await openCheckout(details, pendingCheckout.payload.customerName);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not resume checkout.";
      if (
        message.includes("menu has changed") ||
        message.includes("menu changed") ||
        message.includes("expired") ||
        message.includes("cancelled")
      ) {
        setPendingCheckout(null);
        try {
          localStorage.removeItem(pendingCheckoutKey);
        } catch {
          /* optional */
        }
      }
      setError(message);
      setStatus("error");
      submittingRef.current = false;
    }
  }

  async function abandonCheckout() {
    if (!pendingCheckout || submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    try {
      const details = await checkoutStatus(pendingCheckout);
      if (details === "paid") return;
    } catch {
      // If status check fails or checkout is stale, proceed to clear and let user start fresh
    } finally {
      setPendingCheckout(null);
      try {
        localStorage.removeItem(pendingCheckoutKey);
      } catch {
        /* optional */
      }
      setError("");
      setStatus("idle");
      submittingRef.current = false;
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !itemCount ||
      hasUnpricedItems ||
      knownTotalPaise < 100 ||
      !name.trim() ||
      !seat.trim() ||
      !seatConfirmed ||
      submittingRef.current ||
      pendingPayment ||
      pendingCheckout
    ) {
      return;
    }
    submittingRef.current = true;
    setStatus("submitting");
    setError("");
    try {
      await loadRazorpayCheckout();
      const attempt: PendingCheckout = {
        checkoutKey: crypto.randomUUID(),
        payload: {
          customerName: name.trim(),
          seat: seat.trim(),
          items: lines.map(({ product, variant, quantity }) => ({
            productId: product.id,
            variantId: variant.id,
            quantity,
          })),
        },
      };
      savePendingCheckout(attempt);
      const response = await fetch("/api/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...attempt.payload, checkoutKey: attempt.checkoutKey }),
      });
      const result = await response.json();
      if (response.status === 202) throw new Error("Checkout is still being prepared. Please retry in a moment.");
      if (!response.ok) throw new Error(result.error || "Please try again.");
      const details = result as CheckoutDetails;
      savePendingCheckout({ ...attempt, checkout: details });
      await openCheckout(details, attempt.payload.customerName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      setStatus("error");
      submittingRef.current = false;
    }
  }

  async function saveSeat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmation || secondsLeft === 0 || savingSeat) return;
    setSavingSeat(true);
    setSeatError("");
    try {
      const response = await fetch(`/api/food-orders/${confirmation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat: seatDraft.trim(), editToken: confirmation.editToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      setConfirmation((current) => (current ? { ...current, seat: result.order.seat } : current));
      setSeat(result.order.seat);
      setEditingSeat(false);
    } catch (cause) {
      setSeatError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSavingSeat(false);
    }
  }

  const orderForm = (mobile: boolean) => (
    <form onSubmit={submitOrder} className="space-y-4">
      {/* Customer Name */}
      <label className="block text-xs font-bold text-foreground">
        Your Name <span className="text-gold">*</span>
        <input
          required
          maxLength={120}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name for the order"
          className="order-input"
        />
      </label>

      {/* Screen and seat number */}
      <label className="block text-xs font-bold text-foreground">
        Screen and seat number <span className="text-gold">*</span>
        <input
          required
          maxLength={120}
          value={seat}
          onChange={(event) => {
            setSeat(event.target.value);
            setSeatConfirmed(false);
          }}
          placeholder="e.g. Screen 1 · Row E, Seat 12"
          className="order-input"
        />
        <span className="mt-1 block text-[0.7rem] font-medium text-muted">
          Type your screen and seat number (e.g. Screen 1, Row E 12)
        </span>
      </label>

      {/* Reassuring note */}
      <div className="rounded-xl border border-surface-border bg-surface/60 p-3 text-[0.7rem] leading-relaxed text-muted">
        <p className="flex items-center gap-1.5 font-bold text-foreground">
          <svg className="h-4 w-4 text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>In-Seat Service Guarantee</span>
        </p>
        <p className="mt-1">
          Our cinema staff will locate your seat and hand-deliver your order warm and fresh. Please verify your screen and seat number before paying.
        </p>
      </div>

      <label className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-foreground/90">
        <input
          type="checkbox"
          required
          checked={seatConfirmed}
          onChange={(event) => setSeatConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 rounded accent-[#ae7820]"
        />
        <span>I verified my screen and seat number before paying.</span>
      </label>

      <p className="text-[0.68rem] leading-4 text-muted">
        By paying, you acknowledge our{" "}
        <Link href="/terms-and-conditions" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          Terms
        </Link>
        ,{" "}
        <Link href="/cancellation-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          Cancellation Policy
        </Link>
        , and{" "}
        <Link href="/refund-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          Refund Policy
        </Link>
        .
      </p>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          !itemCount ||
          hasUnpricedItems ||
          knownTotalPaise < 100 ||
          !seat.trim() ||
          !name.trim() ||
          !seatConfirmed ||
          !!pendingPayment ||
          !!pendingCheckout ||
          status === "submitting" ||
          status === "paying" ||
          status === "verifying"
        }
        className="btn-gold min-h-12 w-full justify-center shadow-lg transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "submitting" ? (
          "Preparing checkout…"
        ) : status === "paying" ? (
          "Complete payment…"
        ) : status === "verifying" ? (
          "Confirming payment…"
        ) : (
          <span className="flex items-center gap-2">
            <span>Pay {formatPrice(knownTotalPaise)} Online</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </button>

      {/* Payment methods badge */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[0.65rem] text-muted">
        <svg className="h-3.5 w-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Accepted: UPI · GPay · PhonePe · Cards · NetBanking</span>
      </div>

      {pendingPayment && (
        <button
          type="button"
          onClick={() => void confirmPayment(pendingPayment)}
          disabled={status === "verifying"}
          className="min-h-11 w-full rounded-lg border border-gold px-4 text-sm font-bold text-gold disabled:opacity-50"
        >
          Retry payment confirmation
        </button>
      )}

      {pendingCheckout && !pendingPayment && (
        <div className="rounded-xl border border-gold/35 bg-surface p-3 text-xs text-foreground">
          <p className="font-bold text-foreground">An earlier checkout is still open</p>
          <p className="mt-1 text-muted">
            {pendingCheckout.payload.seat}
            {pendingCheckout.checkout ? ` · ${formatPrice(pendingCheckout.checkout.amountPaise)}` : ""}. Check its payment before starting another order.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={status === "submitting" || status === "verifying" || status === "paying"}
              onClick={() => void resumeCheckout()}
              className="min-h-10 rounded-lg bg-gold px-3 font-bold text-slate-950 disabled:opacity-50"
            >
              Check or resume payment
            </button>
            <button
              type="button"
              disabled={status === "submitting" || status === "verifying" || status === "paying"}
              onClick={() => void abandonCheckout()}
              className="min-h-10 rounded-lg border border-gold/60 px-3 font-bold text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              Start fresh checkout
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400 font-medium">
          {error}
        </p>
      )}

      {mobile && (
        <button
          type="button"
          onClick={() => setCartOpen(false)}
          className="w-full py-2 text-sm font-semibold text-gold"
        >
          Continue browsing menu
        </button>
      )}
    </form>
  );

  const cartContents = () => (
    <>
      {lines.length ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{itemCount} {itemCount === 1 ? "item" : "items"} in cart</span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-muted hover:text-red-700 hover:underline"
            >
              Clear all
            </button>
          </div>

          <ul className="space-y-2.5">
            {lines.map(({ product, variant, quantity, key }) => (
              <li key={key} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-2.5">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#201810]" aria-hidden="true">
                  <ProductImage product={product} sizes="48px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-foreground">{product.name}</span>
                  <span className="block text-[0.7rem] text-muted">
                    {variant.name} · {formatPrice(variant.pricePaise)}
                  </span>
                </span>
                <span className="flex items-center rounded-lg border border-surface-border bg-card">
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, variant.id, -1)}
                    aria-label={`Remove one ${product.name} ${variant.name}`}
                    className="flex min-h-9 min-w-8 items-center justify-center text-base font-bold text-gold transition hover:bg-gold/10 active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, variant.id, 1)}
                    aria-label={`Add one ${product.name} ${variant.name}`}
                    className="flex min-h-9 min-w-8 items-center justify-center text-base font-bold text-gold transition hover:bg-gold/10 active:scale-95"
                  >
                    +
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gold/30 bg-surface/50 p-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
              <path d="M15 2v19" />
              <path d="M6 2v7a3 3 0 0 0 6 0V2" />
              <path d="M9 2v19" />
            </svg>
          </div>
          <p className="mt-2 text-sm font-bold text-foreground">Your cart is empty</p>
          <p className="mt-1 text-xs text-muted">Add butter popcorn, hot puffs, sandwiches, or drinks to get started.</p>
        </div>
      )}

      {/* Bill Breakdown */}
      {lines.length > 0 && !hasUnpricedItems && (
        <div className="mt-5 space-y-1.5 border-t border-surface-border pt-4 text-xs">
          <div className="flex justify-between text-muted">
            <span>Item Subtotal</span>
            <span>{formatPrice(knownTotalPaise)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Delivery to Screen & Seat</span>
            <span className="font-bold">FREE</span>
          </div>
          <div className="flex justify-between border-t border-surface-border pt-2 text-sm font-bold text-foreground">
            <span>Total to pay</span>
            <span className="text-base text-gold">{formatPrice(knownTotalPaise)}</span>
          </div>
        </div>
      )}

      {hasUnpricedItems && <p className="mt-2 text-xs text-red-700">Remove items without a price before checkout.</p>}

      {upgrade && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/35 bg-[#f9edda] p-3">
          <div>
            <p className="flex items-center gap-1 text-xs font-bold text-foreground">
              <svg className="h-3.5 w-3.5 text-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
              </svg>
              <span>More for your money</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Upgrade {upgrade.product.name} to {upgrade.to.name} for only {formatPrice(upgrade.additionalPaise)} more.
            </p>
          </div>
          <button
            type="button"
            onClick={() => applyUpgrade(upgrade.product.id, upgrade.from.id, upgrade.to.id)}
            className="min-h-9 shrink-0 rounded-lg border border-gold bg-gold/10 px-3 text-xs font-bold text-gold hover:bg-gold hover:text-white"
          >
            Upgrade
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-5 border-t border-surface-border pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Recommended Pairings</h3>
          <div className="mt-2.5 space-y-2">
            {suggestions.map(({ product, variant, reason }) => (
              <div key={product.id} className="flex items-center gap-2.5 rounded-xl border border-surface-border bg-surface p-2">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#201810]" aria-hidden="true">
                  <ProductImage product={product} sizes="40px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-foreground">{product.name}</span>
                  <span className="block text-[0.65rem] text-muted">
                    {reason} · {formatPrice(variant.pricePaise)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(product.id, variant.id, 1)}
                  aria-label={`Add suggested ${product.name} ${variant.name}`}
                  className="min-h-8 rounded-lg border border-gold/50 bg-gold/10 px-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-white"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <section id="order-food" className="relative min-h-screen bg-surface pb-32 pt-8 sm:pt-12 lg:pb-24">
        {/* Subtle radial backdrop */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(201,153,58,.15),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header banner */}
          <div className="mb-8 max-w-3xl sm:mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                <path d="M15 2v19" />
                <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                <path d="M9 2v19" />
              </svg>
              <span>In-Seat Dining · Sri Murugan Cafe</span>
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-none text-foreground sm:text-5xl lg:text-6xl">
              Fresh Food. Straight to Your Seat.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Skip the interval counter queue. Pick your favorite cinema snacks, tell us your screen and seat, pay online via UPI or card, and our staff will deliver your order directly to you.
            </p>
          </div>

          {/* Active Order Banner if placed */}
          {confirmation && (
            <div
              role="status"
              className="mb-8 overflow-hidden rounded-2xl border border-gold/50 bg-gradient-to-r from-[#fbf4ea] to-[#f3e5cf] p-4 text-foreground shadow-md sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Live Order #{confirmation.id}</p>
                  </div>
                  <h2 className="mt-1 text-xl font-bold sm:text-2xl">{orderStatusText[confirmation.status] || "Order received"}</h2>
                  <p className="mt-1 text-xs text-foreground/80 sm:text-sm">
                    {confirmation.customerName} · Delivering to: <strong className="text-gold">{confirmation.seat}</strong>
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-2">
                    {orderStatusSteps.map((stepKey, idx) => {
                      const currentIdx = orderStatusSteps.indexOf(confirmation.status);
                      const isComplete = currentIdx >= idx;
                      return (
                        <div key={stepKey} className="flex items-center gap-1.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.62rem] font-bold ${
                              isComplete ? "bg-gold text-white" : "border border-surface-border bg-card text-muted"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className={`text-[0.68rem] capitalize ${isComplete ? "font-bold text-foreground" : "text-muted"}`}>
                            {stepKey}
                          </span>
                          {idx < orderStatusSteps.length - 1 && <span className="text-muted/40">→</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmationOpen(true)}
                    className="btn-gold min-h-10 px-4 text-xs font-bold shadow-sm"
                  >
                    View Order Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationOpen(false);
                      setName("");
                      setSeat("");
                    }}
                    className="min-h-10 rounded-lg border border-surface-border bg-card px-4 text-xs font-bold text-foreground hover:border-gold hover:text-gold"
                  >
                    Order More
                  </button>
                </div>
              </div>
            </div>
          )}

          {menuError && (
            <p role="alert" className="mb-8 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {menuError}{" "}
              <button type="button" onClick={() => window.location.reload()} className="ml-2 font-bold underline">
                Try again
              </button>
            </p>
          )}

          {/* Main Layout: Products Grid + Sticky Cart Sidebar */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start xl:gap-10">
            {/* Products Column */}
            <div className="min-w-0">
              {/* Search & Filter Header */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <label htmlFor={searchInputId} className="sr-only">
                    Search cafe menu
                  </label>
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    id={searchInputId}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search popcorn, sandwiches, cold coffee, puffs, desserts..."
                    className="block w-full rounded-2xl border border-surface-border bg-card py-3 pl-10 pr-10 text-sm text-foreground shadow-sm transition placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-foreground"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Categories & Dietary Filter Bar */}
                <div className="sticky top-[68px] z-30 -mx-4 border-y border-surface-border bg-card/95 px-4 py-2.5 shadow-sm backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:border">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Category tabs */}
                    <div className="touch-scroll-x no-scrollbar flex gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Menu categories">
                      <button
                        type="button"
                        onClick={() => setActiveCategory(null)}
                        className={`min-h-9 shrink-0 rounded-full px-4 text-xs font-bold transition ${
                          activeCategory === null
                            ? "bg-gold text-white shadow-sm"
                            : "border border-surface-border bg-card text-foreground font-semibold hover:border-gold/60"
                        }`}
                      >
                        All Items ({products.length})
                      </button>
                      {categories.map((category) => {
                        const count = products.filter((p) => p.categoryId === category.id).length;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCategory(category.id)}
                            className={`min-h-9 shrink-0 rounded-full px-4 text-xs font-bold transition ${
                              activeCategory === category.id
                                ? "bg-gold text-white shadow-sm"
                                : "border border-surface-border bg-card text-foreground font-semibold hover:border-gold/60"
                            }`}
                          >
                            {category.name} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Dietary toggle chips */}
                    <div className="flex shrink-0 items-center gap-1.5 border-t border-surface-border pt-2 sm:border-0 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => setDietaryFilter("all")}
                        className={`rounded-lg px-2.5 py-1 text-[0.7rem] font-bold ${
                          dietaryFilter === "all" ? "bg-foreground/10 text-foreground" : "text-muted hover:text-foreground"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setDietaryFilter(dietaryFilter === "veg" ? "all" : "veg")}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.7rem] font-bold transition ${
                          dietaryFilter === "veg"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                            : "border-surface-border text-muted hover:border-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        Veg Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setDietaryFilter(dietaryFilter === "non-veg" ? "all" : "non-veg")}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.7rem] font-bold transition ${
                          dietaryFilter === "non-veg"
                            ? "border-red-600 bg-red-50 text-red-800"
                            : "border-surface-border text-muted hover:border-red-600 hover:text-red-700"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                        Non-Veg
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Loading or Products Grid */}
              {menuLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-44 animate-pulse rounded-2xl border border-surface-border bg-card p-4" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gold/30 bg-card p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <p className="mt-2 text-base font-bold text-foreground">No menu items found</p>
                  <p className="mt-1 text-xs text-muted">Try clearing your search query or switching category filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory(null);
                      setDietaryFilter("all");
                    }}
                    className="btn-gold mt-4 text-xs font-bold"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const isVeg = isProductVeg(product);
                    const productQty = product.variants.reduce(
                      (sum, v) => sum + (quantities[lineKey(product.id, v.id)] || 0),
                      0
                    );

                    return (
                      <article
                        key={product.id}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          productQty > 0 ? "border-gold/60 ring-2 ring-gold/15" : "border-surface-border"
                        }`}
                      >
                        <div>
                          <div className="flex gap-3.5">
                            {/* Product Image */}
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#201810]" aria-hidden="true">
                              <ProductImage product={product} sizes="96px" />
                              {/* Veg indicator badge */}
                              <span
                                className={`absolute left-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded border bg-white/95 shadow-sm ${
                                  isVeg ? "border-emerald-600" : "border-red-600"
                                }`}
                                title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
                              >
                                <span className={`h-2 w-2 rounded-full ${isVeg ? "bg-emerald-600" : "bg-red-600"}`} />
                              </span>
                            </div>

                            {/* Product Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-gold sm:text-base">
                                  {product.name}
                                </h3>
                              </div>
                              {product.tag && (
                                <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[0.62rem] font-bold text-gold">
                                  {product.tag}
                                </span>
                              )}
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{product.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Variants and Add to Cart Section */}
                        <div className="mt-3.5 space-y-2 border-t border-surface-border pt-2.5">
                          {product.variants.map((variant) => {
                            const key = lineKey(product.id, variant.id);
                            const quantity = quantities[key] || 0;
                            const isPriced = variant.pricePaise !== null && variant.pricePaise > 0;

                            return (
                              <div key={variant.id} className="flex min-h-10 items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-medium text-foreground">
                                    {product.variants.length > 1 ? variant.name : "Price"}
                                  </span>
                                  <span className="ml-2 text-sm font-extrabold text-gold">
                                    {formatPrice(variant.pricePaise)}
                                  </span>
                                </div>

                                {!isPriced ? (
                                  <span className="rounded-lg bg-surface px-2.5 py-1 text-[0.68rem] font-semibold text-muted">
                                    Unavailable
                                  </span>
                                ) : quantity > 0 ? (
                                  <div className="flex items-center rounded-lg border border-gold bg-gold/10 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => changeQuantity(product.id, variant.id, -1)}
                                      aria-label={`Remove one ${product.name} ${variant.name}`}
                                      className="flex min-h-[38px] min-w-[38px] items-center justify-center text-base font-bold text-gold transition hover:bg-gold hover:text-white active:scale-95"
                                    >
                                      −
                                    </button>
                                    <span className="w-7 text-center text-xs font-black text-foreground">{quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => changeQuantity(product.id, variant.id, 1)}
                                      aria-label={`Add one ${product.name} ${variant.name}`}
                                      className="flex min-h-[38px] min-w-[38px] items-center justify-center text-base font-bold text-gold transition hover:bg-gold hover:text-white active:scale-95"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => changeQuantity(product.id, variant.id, 1)}
                                    aria-label={`Add ${product.name} ${variant.name}`}
                                    className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-gold/60 bg-card px-3.5 text-xs font-bold text-gold shadow-sm transition-all hover:bg-gold hover:text-white active:scale-95"
                                  >
                                    <span>Add</span>
                                    <span aria-hidden="true">+</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Sticky Cart Sidebar */}
            <aside
              className="hidden rounded-3xl border border-gold/30 bg-card p-5 shadow-xl lg:sticky lg:top-24 lg:block"
              aria-label="Your cart and checkout"
            >
              <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3.5">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Seat Delivery</p>
                  <h2 className="mt-0.5 text-xl font-bold text-foreground">Your Order</h2>
                </div>
                {itemCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-2 text-xs font-black text-white">
                    {itemCount}
                  </span>
                )}
              </div>

              {cartContents()}

              {/* Order Form (Customer + Seat + Pay) */}
              <div className="mt-5 border-t border-surface-border pt-4">{orderForm(false)}</div>
            </aside>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Floating Cart Bar */}
      {itemCount > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(56,35,14,.2)] backdrop-blur lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.62rem] font-black text-white">
                  {itemCount}
                </span>
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-gold">
                  {seat ? `To: ${seat}` : "To your seat"}
                </span>
              </div>
              <p className="truncate text-base font-extrabold text-foreground">{formatPrice(knownTotalPaise)}</p>
            </div>
            <button
              ref={cartButtonRef}
              type="button"
              onClick={() => setCartOpen(true)}
              className="btn-gold min-h-11 justify-center px-5 shadow-lg"
            >
              <span>View Cart & Pay</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart & Checkout Modal Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-cart-title"
            className="touch-scroll-y absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-gold/50 bg-card p-5 shadow-2xl sm:mx-auto sm:max-w-xl"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#dfd2bd]" />
            <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3.5">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Sri Murugan Cinema</p>
                <h2 id="mobile-cart-title" className="mt-0.5 text-xl font-bold text-foreground">
                  Your Order · {itemCount} {itemCount === 1 ? "item" : "items"}
                </h2>
              </div>
              <button
                ref={cartCloseRef}
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-foreground hover:border-gold hover:text-gold"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {cartContents()}

            <div className="mt-5 border-t border-surface-border pt-4">{orderForm(true)}</div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {confirmation && confirmationOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-confirmation-title"
            className="touch-scroll-y max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/40 bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-7"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Order Confirmed · #{confirmation.id}</p>
                </div>
                <h2 id="order-confirmation-title" className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  {orderStatusText[confirmation.status] || "Order received"}
                </h2>
                <p className="mt-1 text-xs text-muted sm:text-sm">
                  Thank you, <strong>{confirmation.customerName}</strong>! Your order was sent to the cinema cafe kitchen.
                </p>
              </div>
              <button
                ref={confirmationCloseRef}
                type="button"
                onClick={() => setConfirmationOpen(false)}
                aria-label="Close order confirmation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-border text-foreground hover:border-gold hover:text-gold"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Screen & Seat Card */}
            <div className="mt-5 rounded-2xl border border-gold/35 bg-[#f9edda] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Delivering To</p>
              <p className="mt-1 text-xl font-black text-foreground sm:text-2xl">{confirmation.seat}</p>

              {secondsLeft > 0 ? (
                <>
                  <p className="mt-2.5 text-xs text-muted">
                    Need to correct your seat? Changes close in <strong className="text-gold">{secondsLeft}s</strong>
                  </p>
                  {editingSeat ? (
                    <form onSubmit={saveSeat} className="mt-3.5 space-y-3">
                      <label className="block text-xs font-semibold text-foreground">
                        Correct screen and seat
                        <input
                          required
                          maxLength={120}
                          autoFocus
                          value={seatDraft}
                          onChange={(event) => setSeatDraft(event.target.value)}
                          className="order-input"
                          placeholder="e.g. Screen 1 · Row E, Seat 12"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={savingSeat || secondsLeft === 0}
                          className="btn-gold min-h-10 flex-1 justify-center text-xs disabled:opacity-50"
                        >
                          {savingSeat ? "Saving…" : "Save New Seat"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSeat(false);
                            setSeatError("");
                          }}
                          className="min-h-10 rounded-lg border border-surface-border bg-card px-4 text-xs font-bold text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                      {seatError && <p role="alert" className="text-xs text-red-700">{seatError}</p>}
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSeatDraft(confirmation.seat);
                        setEditingSeat(true);
                        setSeatError("");
                      }}
                      className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gold bg-card px-3 text-xs font-bold text-gold hover:bg-gold hover:text-white"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                      <span>Edit seat number</span>
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-muted">Seat edit window has closed.</p>
              )}
            </div>

            {/* Items summary */}
            <div className="mt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Your Items</h3>
              <ul className="mt-2.5 space-y-2">
                {confirmation.items.map((item) => (
                  <li
                    key={lineKey(item.productId, item.variantId)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-3"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                      <span className="block text-xs text-muted">{item.variantName}</span>
                    </div>
                    <span className="text-sm font-bold text-gold">
                      {formatPrice(item.unitPricePaise)} × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setConfirmationOpen(false)}
              className="btn-gold mt-6 min-h-11 w-full justify-center shadow-md"
            >
              Done & Return to Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
