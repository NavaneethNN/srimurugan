"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type FoodCategory, type FoodOrderItem, type FoodProduct } from "@/lib/foodMenu";
import { recommendAddOns, recommendVariantUpgrade } from "@/lib/foodRecommendations";

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
  pending: "Received by the cafe",
  preparing: "Preparing your order",
  completed: "Order completed",
  cancelled: "Order cancelled",
};
function confirmationFrom(result: ConfirmationPayload, receivedAt: number): Confirmation {
  return { id: result.order.id, status: result.order.status, customerName: result.order.customerName,
    seat: result.order.seat, items: result.order.items, editToken: result.editToken,
    editDeadline: receivedAt + result.editRemainingMs, editWindowMs: result.editWindowMs };
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
};
const pendingCheckoutKey = "srimurugan-pending-checkout-v1";
type RazorpayCheckout = { open: () => void; on: (event: string, callback: (response: unknown) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout;
let checkoutScriptPromise: Promise<RazorpayConstructor> | null = null;

function loadRazorpayCheckout() {
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
    if (existing) { resolve(existing); return; }
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
  }).catch((error) => { checkoutScriptPromise = null; throw error; });
  return checkoutScriptPromise;
}

function keepFocusInside(event: KeyboardEvent, dialogLabel: string) {
  if (event.key !== "Tab") return;
  const dialog = document.querySelector<HTMLElement>(`[aria-labelledby="${dialogLabel}"]`);
  const focusable = dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function ProductImage({ product, sizes }: { product: FoodProduct; sizes: string }) {
  return product.imageUrl ? (
    <Image src={product.imageUrl} alt={product.name} fill sizes={sizes} unoptimized={product.imageUrl.startsWith("https://")} className="object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#f0e2cb] text-3xl text-gold" aria-label={product.name}>✦</div>
  );
}

export default function OrderFood() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartReady, setCartReady] = useState(false);
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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(pendingPaymentKey) || "null") as PendingPayment | null;
      if (saved && Number.isSafeInteger(saved.orderId) && saved.payment?.razorpay_payment_id) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPendingPayment(saved);
      }
    } catch { /* Payment recovery storage is optional. */ }
    try {
      const savedCheckout = JSON.parse(localStorage.getItem(pendingCheckoutKey) || "null") as PendingCheckout | null;
      if (savedCheckout && typeof savedCheckout.checkoutKey === "string" && savedCheckout.payload?.customerName && savedCheckout.payload?.seat) {
        setPendingCheckout(savedCheckout);
        setName(savedCheckout.payload.customerName);
        setSeat(savedCheckout.payload.seat);
      }
    } catch { /* Checkout recovery storage is optional. */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refreshOrderStatus() {
      try {
        const response = await fetch("/api/food-orders/current", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as ConfirmationPayload;
        if (cancelled) return;
        const receivedAt = currentTime();
        setNow(receivedAt);
        setConfirmation((current) => {
          if (current && current.id > result.order.id) return current;
          if (current?.id === result.order.id && current.status === result.order.status && current.seat === result.order.seat) return current;
          return confirmationFrom(result, receivedAt);
        });
      } catch { /* Keep the last known status while the connection is unavailable. */ }
    }
    void refreshOrderStatus();
    const interval = confirmation?.id ? window.setInterval(() => void refreshOrderStatus(), 5_000) : null;
    return () => { cancelled = true; if (interval !== null) window.clearInterval(interval); };
  }, [confirmation?.id]);

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
        setActiveCategory(data.categories?.[0]?.id ?? null);
        let saved: Record<string, number> = {};
        try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* Cart storage is optional. */ }
        const valid = new Set<string>();
        for (const product of data.products as FoodProduct[]) for (const variant of product.variants) if (variant.pricePaise !== null && variant.pricePaise > 0) valid.add(lineKey(product.id, variant.id));
        const restored: Record<string, number> = {};
        for (const [key, quantity] of Object.entries(saved)) if (valid.has(key) && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) restored[key] = quantity;
        setQuantities(restored);
        setCartReady(true);
      } catch (cause) {
        if (!cancelled) setMenuError(cause instanceof Error ? cause.message : "Unable to load the menu.");
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }
    void loadMenu();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try { localStorage.setItem(storageKey, JSON.stringify(quantities)); } catch { /* Cart storage is optional. */ }
  }, [quantities, cartReady]);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    const returnFocus = cartButtonRef.current;
    document.body.style.overflow = "hidden";
    cartCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
      keepFocusInside(event, "mobile-cart-title");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); returnFocus?.focus(); };
  }, [cartOpen]);

  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setInterval(() => {
      setNow(currentTime());
      if (currentTime() >= confirmation.editDeadline) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [confirmation]);

  useEffect(() => {
    if (!confirmationOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmationCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmationOpen(false);
      keepFocusInside(event, "order-confirmation-title");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [confirmationOpen]);

  const lines: CartLine[] = products.flatMap((product) => product.variants.flatMap((variant) => {
    const key = lineKey(product.id, variant.id);
    const quantity = quantities[key] || 0;
    return quantity > 0 ? [{ product, variant, quantity, key }] : [];
  }));
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const knownTotalPaise = lines.reduce((total, line) => total + (line.variant.pricePaise || 0) * line.quantity, 0);
  const hasUnpricedItems = lines.some((line) => line.variant.pricePaise === null || line.variant.pricePaise <= 0);
  const suggestions = recommendAddOns(categories, products, lines.map((line) => ({ productId: line.product.id, variantId: line.variant.id })), knownTotalPaise);
  const upgrade = recommendVariantUpgrade(products, lines.map((line) => ({ productId: line.product.id, variantId: line.variant.id, quantity: line.quantity })), knownTotalPaise);
  const secondsLeft = confirmation ? Math.max(0, Math.ceil((confirmation.editDeadline - now) / 1000)) : 0;

  function changeQuantity(productId: number, variantId: string, change: number) {
    const key = lineKey(productId, variantId);
    setStatus("idle");
    setQuantities((current) => ({ ...current, [key]: Math.max(0, Math.min(20, (current[key] || 0) + change)) }));
  }

  function applyUpgrade(productId: number, fromId: string, toId: string) {
    setStatus("idle");
    setQuantities((current) => ({ ...current, [lineKey(productId, fromId)]: 0, [lineKey(productId, toId)]: 1 }));
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
    try { localStorage.removeItem(pendingPaymentKey); } catch { /* Payment recovery storage is optional. */ }
    setPendingCheckout(null);
    try { localStorage.removeItem(pendingCheckoutKey); } catch { /* Checkout recovery storage is optional. */ }
    submittingRef.current = false;
  }

  async function confirmPayment(pending: PendingPayment) {
    setPendingPayment(pending);
    try { localStorage.setItem(pendingPaymentKey, JSON.stringify(pending)); } catch { /* Payment recovery storage is optional. */ }
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
      setError(`${cause instanceof Error ? cause.message : "Payment confirmation is delayed."} Payment ID: ${pending.payment.razorpay_payment_id}. Please do not pay again.`);
      setStatus("error");
      submittingRef.current = false;
    }
  }

  function savePendingCheckout(attempt: PendingCheckout) {
    setPendingCheckout(attempt);
    try { localStorage.setItem(pendingCheckoutKey, JSON.stringify(attempt)); } catch { /* Checkout recovery storage is optional. */ }
  }

  async function checkoutStatus(attempt: PendingCheckout): Promise<CheckoutDetails | "paid" | null> {
    const response = await fetch("/api/food-orders/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutKey: attempt.checkoutKey }),
    });
    const result = await response.json();
    if (response.status === 404 && !attempt.checkout) return null;
    if (response.status === 202) throw new Error("Checkout is still being prepared. Please retry in a moment.");
    if (!response.ok) throw new Error(result.error || "Could not check payment status.");
    if (result.paymentStatus === "paid") { showConfirmation(result); return "paid"; }
    return result as CheckoutDetails;
  }

  async function openCheckout(details: CheckoutDetails, customerName: string) {
    const Razorpay = await loadRazorpayCheckout();
    let paymentCallbackStarted = false;
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
      modal: { ondismiss: () => {
        if (!paymentCallbackStarted) {
          setError("Checkout closed. Check payment status before trying again.");
          setStatus("error");
          submittingRef.current = false;
        }
      } },
    });
    checkout.on("payment.failed", () => {
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
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingCheckout.payload, checkoutKey: pendingCheckout.checkoutKey }),
        });
        const result = await response.json();
        if (response.status === 202) throw new Error("Checkout is still being prepared. Please retry in a moment.");
        if (!response.ok) throw new Error(result.error || "Please try again.");
        details = result as CheckoutDetails;
      }
      if (!details) { submittingRef.current = false; return; }
      savePendingCheckout({ ...pendingCheckout, checkout: details });
      await openCheckout(details, pendingCheckout.payload.customerName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resume checkout.");
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
      setPendingCheckout(null);
      try { localStorage.removeItem(pendingCheckoutKey); } catch { /* Checkout recovery storage is optional. */ }
      setError("");
      setStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check payment status.");
      setStatus("error");
    } finally { submittingRef.current = false; }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!itemCount || hasUnpricedItems || knownTotalPaise < 100 || !name.trim() || !seat.trim() || !seatConfirmed || submittingRef.current || pendingPayment || pendingCheckout) return;
    submittingRef.current = true;
    setStatus("submitting");
    setError("");
    try {
      await loadRazorpayCheckout();
      const attempt: PendingCheckout = {
        checkoutKey: crypto.randomUUID(),
        payload: { customerName: name.trim(), seat: seat.trim(), items: lines.map(({ product, variant, quantity }) => ({ productId: product.id, variantId: variant.id, quantity })) },
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
      const response = await fetch(`/api/food-orders/${confirmation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seat: seatDraft.trim(), editToken: confirmation.editToken }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      setConfirmation((current) => current ? { ...current, seat: result.order.seat } : current);
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
      <label className="block text-xs font-semibold text-foreground/80">Your name <span className="text-gold">*</span><input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name for the order" className="order-input" /></label>
      <label className="block text-xs font-semibold text-foreground/80">Screen and seat number <span className="text-gold">*</span><input required maxLength={120} value={seat} onChange={(event) => { setSeat(event.target.value); setSeatConfirmed(false); }} placeholder="For example, Screen 1 · E12" className="order-input" /></label>
      <p className="text-xs leading-5 text-muted">Please allow 20–25 minutes for service. Check your seat number carefully: an incorrect seat may result in cancellation without a refund. No exchanges or refunds apply, except where required by law. Payment is online only.</p>
      <label className="flex items-start gap-2 text-xs font-semibold leading-5 text-foreground/80"><input type="checkbox" required checked={seatConfirmed} onChange={(event) => setSeatConfirmed(event.target.checked)} className="mt-1 accent-[#ae7820]" /><span>I checked my screen and seat number before paying.</span></label>
      <p className="text-xs leading-5 text-muted">By paying, you acknowledge our <Link href="/terms-and-conditions" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>, <Link href="/cancellation-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Cancellation Policy</Link>, and <Link href="/refund-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Refund Policy</Link>.</p>
      <button type="submit" disabled={!itemCount || hasUnpricedItems || knownTotalPaise < 100 || !!pendingPayment || !!pendingCheckout || status === "submitting" || status === "paying" || status === "verifying"} className="btn-gold min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">{status === "submitting" ? "Preparing checkout…" : status === "paying" ? "Complete payment…" : status === "verifying" ? "Confirming payment…" : `Pay ${formatPrice(knownTotalPaise)} online`} <span aria-hidden="true">→</span></button>
      {pendingPayment && <button type="button" onClick={() => void confirmPayment(pendingPayment)} disabled={status === "verifying"} className="min-h-11 w-full rounded-lg border border-gold px-4 text-sm font-bold text-gold disabled:opacity-50">Retry payment confirmation</button>}
      {pendingCheckout && !pendingPayment && <div className="rounded-xl border border-gold/35 bg-[#f9edda] p-3 text-xs text-foreground"><p className="font-bold">An earlier checkout is still open</p><p className="mt-1 text-muted">{pendingCheckout.payload.seat}{pendingCheckout.checkout ? ` · ${formatPrice(pendingCheckout.checkout.amountPaise)}` : ""}. Check its payment before starting another order.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={status === "submitting" || status === "verifying" || status === "paying"} onClick={() => void resumeCheckout()} className="min-h-10 rounded-lg bg-gold px-3 font-bold text-white disabled:opacity-50">Check or resume payment</button><button type="button" disabled={status === "submitting" || status === "verifying" || status === "paying"} onClick={() => void abandonCheckout()} className="min-h-10 rounded-lg border border-gold px-3 font-bold text-gold disabled:opacity-50">Start a new checkout</button></div></div>}
      {status === "error" && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-center text-xs text-red-700">{error}</p>}
      {mobile && <button type="button" onClick={() => setCartOpen(false)} className="w-full py-2 text-sm font-semibold text-gold">Continue browsing</button>}
    </form>
  );

  const cartContents = () => (
    <>
      {lines.length ? <ul className="space-y-3">{lines.map(({ product, variant, quantity, key }) => <li key={key} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-3"><span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg" aria-hidden="true"><ProductImage product={product} sizes="48px" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{product.name}</span><span className="block text-xs text-muted">{variant.name} · {formatPrice(variant.pricePaise)}</span></span><span className="flex items-center rounded-lg border border-surface-border"><button type="button" onClick={() => changeQuantity(product.id, variant.id, -1)} aria-label={`Remove one ${product.name} ${variant.name}`} className="h-9 w-7 text-lg text-gold">−</button><span className="w-5 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => changeQuantity(product.id, variant.id, 1)} aria-label={`Add one ${product.name} ${variant.name}`} className="h-9 w-7 text-lg text-gold">+</button></span></li>)}</ul> : <p className="rounded-xl border border-dashed border-gold/25 p-6 text-center text-sm text-muted">Your cart is empty. Start with a movie-time favourite.</p>}
      {lines.length > 0 && !hasUnpricedItems && <div className="mt-5 flex justify-between border-t border-surface-border pt-4 text-sm font-semibold text-foreground"><span>{"Total to pay"}</span><span>{formatPrice(knownTotalPaise)}</span></div>}
      {hasUnpricedItems && <p className="mt-1 text-xs text-red-700">Remove items without a price before checkout.</p>}
      {upgrade && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/35 bg-[#f9edda] p-3"><div><p className="text-xs font-bold text-foreground">More for your money</p><p className="mt-1 text-xs text-muted">Upgrade {upgrade.product.name} from {upgrade.from.name} to {upgrade.to.name} for {formatPrice(upgrade.additionalPaise)} more.</p></div><button type="button" onClick={() => applyUpgrade(upgrade.product.id, upgrade.from.id, upgrade.to.id)} className="min-h-10 shrink-0 rounded-lg border border-gold px-3 text-xs font-bold text-gold">Upgrade</button></div>}
      {suggestions.length > 0 && <div className="mt-5 border-t border-surface-border pt-4"><h3 className="text-sm font-bold text-foreground">Good with your order</h3><div className="mt-3 space-y-2">{suggestions.map(({ product, variant, reason }) => <div key={product.id} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-2"><span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg" aria-hidden="true"><ProductImage product={product} sizes="44px" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-foreground">{product.name} · {variant.name}</span><span className="block text-[.65rem] text-muted">{reason} · {formatPrice(variant.pricePaise)}</span></span><button type="button" onClick={() => changeQuantity(product.id, variant.id, 1)} aria-label={`Add suggested ${product.name} ${variant.name}`} className="min-h-9 rounded-lg border border-gold px-2.5 text-xs font-bold text-gold">Add</button></div>)}</div></div>}
    </>
  );

  return (
    <>
      <section id="order-food" className="relative bg-surface pb-28 pt-12 sm:pt-16 lg:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(201,153,58,.13),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-2xl sm:mb-12"><p className="text-[0.68rem] font-bold uppercase tracking-[0.25em] text-gold">Sri Murugan Cinema · Food & drinks</p><h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl font-semibold leading-none text-foreground sm:text-6xl">Good food. Great film.</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">Choose your cinema favourites, pay online, and tell us your screen and seat. We’ll bring your order to you.</p></div>
          {confirmation && <div role="status" className="mb-7 rounded-2xl border border-gold/40 bg-[#f3e5cf] p-4 text-foreground sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Your order · #{confirmation.id}</p><h2 className="mt-1 text-xl font-bold">{orderStatusText[confirmation.status] || "Order received"}</h2><p className="mt-1 text-sm text-foreground/75">{confirmation.customerName} · Screen and seat: <strong>{confirmation.seat}</strong></p><p className="mt-2 text-xs text-muted">Status updates automatically.</p></div><div className="flex gap-2"><button type="button" onClick={() => setConfirmationOpen(true)} className="min-h-10 rounded-lg border border-gold px-3 text-xs font-bold text-gold">View order</button><button type="button" onClick={() => { setConfirmationOpen(false); setName(""); setSeat(""); }} className="min-h-10 rounded-lg border border-surface-border px-3 text-xs font-bold">Order again</button></div></div></div>}
          {menuError && <p role="alert" className="mb-7 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{menuError} <button type="button" onClick={() => window.location.reload()} className="ml-2 font-bold underline">Try again</button></p>}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start xl:gap-10">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">The menu</p><h2 className="mt-1 text-2xl font-bold text-foreground">Find your film-time favourite</h2></div><span className="text-xs text-muted">Choose a size and add to your cart</span></div>
              {menuLoading ? <p className="rounded-xl border border-surface-border bg-card p-8 text-center text-muted">Loading cafe menu…</p> : categories.length === 0 ? <p className="rounded-xl border border-surface-border bg-card p-8 text-center text-muted">The cafe menu is being updated. Please check back shortly.</p> : <>
                <div className="sticky top-[68px] z-30 -mx-4 mb-7 border-y border-surface-border bg-card/95 px-4 py-3 shadow-[0_10px_20px_rgba(56,35,14,.09)] backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border" aria-label="Food categories"><div className="flex gap-2 overflow-x-auto">{categories.map((category) => <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} aria-pressed={activeCategory === category.id} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition ${activeCategory === category.id ? "bg-gold text-white" : "border border-surface-border bg-card text-foreground/70 hover:border-gold/60 hover:text-foreground"}`}>{category.name}</button>)}</div></div>
                <div className="grid gap-4 sm:grid-cols-2">{products.filter((product) => product.categoryId === activeCategory).map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-surface-border bg-card shadow-[0_10px_30px_rgba(56,35,14,.05)]"><div className="flex gap-4 p-4"><span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl" aria-hidden="true"><ProductImage product={product} sizes="96px" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-bold text-foreground">{product.name}</h3>{product.tag && <span className="rounded-full bg-[#f3e5cf] px-2 py-0.5 text-[0.6rem] font-bold text-gold">{product.tag}</span>}</div><p className="mt-1 text-xs leading-relaxed text-muted">{product.description}</p></div></div><div className="space-y-2 border-t border-surface-border px-4 py-3">{product.variants.map((variant) => { const quantity = quantities[lineKey(product.id, variant.id)] || 0; return <div key={variant.id} className="flex min-h-11 items-center gap-2"><span className="min-w-0 flex-1 text-sm font-medium text-foreground">{variant.name}</span><span className="text-sm font-bold text-gold">{formatPrice(variant.pricePaise)}</span>{variant.pricePaise === null || variant.pricePaise <= 0 ? <span className="ml-1 text-xs text-muted">Coming soon</span> : quantity ? <div className="ml-1 flex items-center rounded-lg border border-gold/50"><button type="button" onClick={() => changeQuantity(product.id, variant.id, -1)} aria-label={`Remove one ${product.name} ${variant.name}`} className="flex h-9 w-8 items-center justify-center text-lg text-gold">−</button><span className="w-5 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => changeQuantity(product.id, variant.id, 1)} aria-label={`Add one ${product.name} ${variant.name}`} className="flex h-9 w-8 items-center justify-center text-lg text-gold">+</button></div> : <button type="button" onClick={() => changeQuantity(product.id, variant.id, 1)} aria-label={`Add ${product.name} ${variant.name}`} className="ml-1 min-h-9 rounded-lg border border-gold px-3 text-xs font-bold text-gold hover:bg-gold hover:text-white">Add +</button>}</div>; })}</div></article>)}</div>
                {!products.some((product) => product.categoryId === activeCategory) && <p className="rounded-xl border border-dashed border-gold/25 p-8 text-center text-sm text-muted">No products in this category yet.</p>}
              </>}
            </div>
            <aside className="hidden rounded-2xl border border-gold/25 bg-card p-5 shadow-[0_20px_50px_rgba(56,35,14,.1)] lg:sticky lg:top-24 lg:block" aria-label="Your cart"><div className="mb-5 flex items-center justify-between border-b border-surface-border pb-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Your cart</p><h2 className="mt-1 text-xl font-bold text-foreground">Your order</h2></div><span className="rounded-full bg-gold px-2.5 py-1 text-sm font-black text-white">{itemCount}</span></div>{cartContents()}<div className="mt-5 border-t border-surface-border pt-5">{orderForm(false)}</div></aside>
          </div>
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(56,35,14,.15)] backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}><div className="mx-auto flex max-w-2xl items-center gap-3"><div className="min-w-0 flex-1"><p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gold">Your cart</p><p className="text-sm font-semibold text-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} selected</p></div><button ref={cartButtonRef} type="button" onClick={() => setCartOpen(true)} className="btn-gold min-h-11 justify-center px-5">View cart <span className="rounded-full bg-black/15 px-1.5">{itemCount}</span></button></div></div>
      {cartOpen && <div className="fixed inset-0 z-[70] lg:hidden" role="presentation"><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="absolute inset-0 bg-black/75" /><div role="dialog" aria-modal="true" aria-labelledby="mobile-cart-title" className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-gold/40 bg-card p-5 shadow-2xl sm:mx-auto sm:max-w-xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#dfd2bd]" /><div className="mb-5 flex items-center justify-between border-b border-surface-border pb-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Your cart</p><h2 id="mobile-cart-title" className="mt-1 text-xl font-bold text-foreground">Your order · {itemCount} {itemCount === 1 ? "item" : "items"}</h2></div><button ref={cartCloseRef} type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-xl text-foreground">×</button></div>{cartContents()}<div className="mt-5 border-t border-surface-border pt-5">{orderForm(true)}</div></div></div>}
      {confirmation && confirmationOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title" className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/35 bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-7" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Order #{confirmation.id}</p><h2 id="order-confirmation-title" className="mt-1 text-2xl font-bold text-foreground">{orderStatusText[confirmation.status] || "Order received"}</h2><p className="mt-1 text-sm text-muted">Thank you, {confirmation.customerName}. Your request was sent to cinema staff.</p></div><button ref={confirmationCloseRef} type="button" onClick={() => setConfirmationOpen(false)} aria-label="Close order confirmation" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-border text-xl text-foreground">×</button></div><div className="mt-5 rounded-xl border border-gold/35 bg-[#f9edda] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Your screen and seat</p><p className="mt-1 text-2xl font-bold text-foreground">{confirmation.seat}</p>{secondsLeft > 0 ? <><p className="mt-3 text-sm text-muted">Seat changes close in <strong className="text-gold">{secondsLeft}s</strong></p>{editingSeat ? <form onSubmit={saveSeat} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-foreground">Correct screen and seat<input required maxLength={120} autoFocus value={seatDraft} onChange={(event) => setSeatDraft(event.target.value)} className="order-input" placeholder="For example, Screen 1 · E12" /></label><div className="flex gap-2"><button type="submit" disabled={savingSeat || secondsLeft === 0} className="btn-gold min-h-11 flex-1 justify-center disabled:opacity-50">{savingSeat ? "Saving…" : "Save seat"}</button><button type="button" onClick={() => { setEditingSeat(false); setSeatError(""); }} className="min-h-11 rounded-lg border border-surface-border px-4 text-sm text-foreground">Cancel</button></div>{seatError && <p role="alert" className="text-xs text-red-700">{seatError}</p>}</form> : <button type="button" onClick={() => { setSeatDraft(confirmation.seat); setEditingSeat(true); setSeatError(""); }} className="mt-4 min-h-11 rounded-lg border border-gold px-4 text-sm font-bold text-gold">Edit seat number</button>}</> : <p className="mt-3 text-xs text-muted">The seat edit window has closed.</p>}</div><div className="mt-5"><h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Your items</h3><ul className="mt-3 space-y-2">{confirmation.items.map((item) => <li key={lineKey(item.productId, item.variantId)} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface p-3"><span className="text-sm font-semibold text-foreground">{item.name} · {item.variantName}</span><span className="text-sm font-bold text-gold">{formatPrice(item.unitPricePaise)} × {item.quantity}</span></li>)}</ul></div><button type="button" onClick={() => setConfirmationOpen(false)} className="btn-gold mt-4 min-h-11 w-full justify-center">Done</button></div></div>}
    </>
  );
}
