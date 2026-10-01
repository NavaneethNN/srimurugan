"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, menuItems, pairings, type Category } from "@/lib/foodMenu";

type Status = "idle" | "submitting" | "success" | "error";
type OrderedItem = { name: string; quantity: number; image: string };
type Confirmation = {
  id: number;
  customerName: string;
  seat: string;
  items: OrderedItem[];
  editToken: string;
  editDeadline: number;
  editWindowMs: number;
};
const storageKey = "srimurugan-food-cart";
const currentTime = () => Date.now();

export default function OrderFood() {
  const [activeCategory, setActiveCategory] = useState<Category>("Snacks");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [seat, setSeat] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState(false);
  const [seatDraft, setSeatDraft] = useState("");
  const [seatError, setSeatError] = useState("");
  const [savingSeat, setSavingSeat] = useState(false);
  const [now, setNow] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const confirmationCloseRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const restored: Record<string, number> = {};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const item of menuItems) {
          const quantity = saved[item.name];
          if (Number.isInteger(quantity) && quantity > 0 && quantity <= 20) restored[item.name] = quantity;
        }
      }
    } catch { /* Ignore unavailable or invalid storage. */ }
    queueMicrotask(() => {
      if (cancelled) return;
      setQuantities(restored);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(quantities)); } catch { /* Storage is optional. */ }
  }, [quantities, ready]);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    const returnFocus = cartButtonRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>('[aria-labelledby="mobile-cart-title"]');
        const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
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
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
      returnFocus?.focus();
    };
  }, [cartOpen]);

  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setInterval(() => {
      setNow(currentTime());
    }, 250);
    const closeTimer = window.setTimeout(() => {
      setNow(currentTime());
      setConfirmationOpen(false);
    }, Math.max(0, confirmation.editDeadline - currentTime()));
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(closeTimer);
    };
  }, [confirmation]);

  useEffect(() => {
    if (!confirmationOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmationCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmationOpen(false);
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>('[aria-labelledby="order-confirmation-title"]');
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmationOpen]);

  const selectedItems = menuItems.filter((item) => (quantities[item.name] || 0) > 0);
  const itemCount = selectedItems.reduce((total, item) => total + quantities[item.name], 0);
  const hasDrink = selectedItems.some((item) => item.category === "Drinks");
  const hasSnack = selectedItems.some((item) => item.category === "Snacks");
  const suggestion = !hasSnack ? menuItems[0] : !hasDrink ? menuItems.find((item) => item.name === "Coke") : menuItems.find((item) => item.name === "Brownie with ice cream");
  const showSuggestion = suggestion && !quantities[suggestion.name];
  const secondsLeft = confirmation ? Math.max(0, Math.ceil((confirmation.editDeadline - now) / 1000)) : 0;

  const changeQuantity = (itemName: string, change: number) => {
    setStatus("idle");
    setQuantities((current) => ({ ...current, [itemName]: Math.max(0, Math.min(20, (current[itemName] || 0) + change)) }));
  };
  const addPairing = (items: string[]) => {
    setStatus("idle");
    setQuantities((current) => {
      const next = { ...current };
      for (const item of items) next[item] = Math.min(20, (next[item] || 0) + 1);
      return next;
    });
  };
  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemCount || !name.trim() || !seat.trim() || submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: name.trim(), seat: seat.trim(), items: selectedItems.map((item) => ({ name: item.name, quantity: quantities[item.name] })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      const orderedItems: OrderedItem[] = result.order.items.map((item: { name: string; quantity: number }) => ({
        ...item,
        image: menuItems.find((menuItem) => menuItem.name === item.name)?.image || "/food/popcorn.jpg",
      }));
      const receivedAt = currentTime();
      setConfirmation({
        id: result.order.id,
        customerName: result.order.customerName,
        seat: result.order.seat,
        items: orderedItems,
        editToken: result.editToken,
        editDeadline: receivedAt + result.editRemainingMs,
        editWindowMs: result.editWindowMs,
      });
      setNow(receivedAt);
      setSeatDraft(result.order.seat);
      setEditingSeat(false);
      setSeatError("");
      setStatus("success");
      setQuantities({});
      setCartOpen(false);
      setConfirmationOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  };

  const saveSeat = async (event: FormEvent<HTMLFormElement>) => {
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
      setConfirmation((current) => current ? { ...current, seat: result.order.seat } : current);
      setSeat(result.order.seat);
      setEditingSeat(false);
    } catch (cause) {
      setSeatError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setSavingSeat(false);
    }
  };

  const startAnotherOrder = () => {
    setConfirmation(null);
    setConfirmationOpen(false);
    setStatus("idle");
    setName("");
    setSeat("");
  };

  const orderForm = (mobile: boolean) => (
    <form onSubmit={submitOrder} className="space-y-4">
      <label className="block text-xs font-semibold text-white/80">Your name <span className="text-gold">*</span>
        <input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name for the order" className="order-input" />
      </label>
      <label className="block text-xs font-semibold text-white/80">Screen and seat number <span className="text-gold">*</span>
        <input required maxLength={120} value={seat} onChange={(event) => setSeat(event.target.value)} placeholder="For example, Screen 1 · E12" className="order-input" />
      </label>
      <p className="text-xs leading-5 text-white/65">
        Please allow 20–25 minutes for service. Check your seat number carefully: an incorrect seat may result in cancellation without a refund. No exchanges or refunds apply, except where required by law. Payment is online only when checkout is available.
      </p>
      <p className="text-xs leading-5 text-white/65">
        By sending your request, you acknowledge our <Link href="/terms-and-conditions" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>, <Link href="/cancellation-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Cancellation Policy</Link>, and <Link href="/refund-policy" className="text-gold underline underline-offset-2" target="_blank" rel="noopener noreferrer">Refund Policy</Link>.
      </p>
      <button type="submit" disabled={!itemCount || status === "submitting"} className="btn-gold min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">
        {status === "submitting" ? "Sending your order…" : "Send order request"}
        {status !== "submitting" && <span aria-hidden="true">→</span>}
      </button>
      {status === "error" && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-center text-xs text-red-300">{error}</p>}
      {mobile && <button type="button" onClick={() => setCartOpen(false)} className="w-full py-2 text-sm font-semibold text-gold">Continue browsing</button>}
    </form>
  );

  const cartContents = () => (
    <>
      {selectedItems.length ? (
        <div className="space-y-3">
          {selectedItems.map((item) => (
            <div key={item.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg" aria-hidden="true"><Image src={item.image} alt="" fill sizes="44px" className="object-cover" /></span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.name}</span>
              <div className="flex items-center rounded-lg border border-white/15" aria-label={`${item.name} quantity`}>
                <button type="button" onClick={() => changeQuantity(item.name, -1)} aria-label={`Remove one ${item.name}`} className="h-9 w-8 text-lg text-gold">−</button>
                <span className="w-5 text-center text-sm font-bold">{quantities[item.name]}</span>
                <button type="button" onClick={() => changeQuantity(item.name, 1)} aria-label={`Add one ${item.name}`} className="h-9 w-8 text-lg text-gold">+</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-gold/25 p-6 text-center text-sm text-muted">Your cart is empty. Start with a movie-time favourite.</p>}
      {itemCount > 0 && showSuggestion && (
        <div className="mt-5 rounded-xl border border-gold/30 bg-gold/[0.08] p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold">Make it a movie night</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg" aria-hidden="true"><Image src={suggestion.image} alt="" fill sizes="56px" className="object-cover" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">Add {suggestion.name}</p><p className="text-xs text-muted">{suggestion.description}</p></div>
            <button type="button" onClick={() => changeQuantity(suggestion.name, 1)} className="min-h-10 rounded-lg border border-gold px-3 text-xs font-bold text-gold hover:bg-gold hover:text-background">Add +</button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <section id="order-food" className="relative bg-surface pb-28 pt-12 sm:pt-16 lg:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(201,153,58,.13),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-2xl sm:mb-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.25em] text-gold">Sri Murugan Cinema · Food & drinks</p>
            <h1 className="mt-3 font-[family-name:var(--font-cormorant)] text-5xl font-semibold leading-none text-white sm:text-6xl">Good food. Great film.</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">Choose your cinema favourites, then send your order request with your screen and seat. We’ll take it from there.</p>
          </div>

          {confirmation && <div role="status" className="mb-7 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-white sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Order placed · #{confirmation.id}</p><h2 className="mt-1 text-xl font-bold">Thank you, {confirmation.customerName}.</h2><p className="mt-1 text-sm text-white/75">Screen and seat: <strong className="text-white">{confirmation.seat}</strong></p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setConfirmationOpen(true)} className="min-h-10 rounded-lg border border-gold px-3 text-xs font-bold text-gold">View order</button><button type="button" onClick={startAnotherOrder} className="min-h-10 rounded-lg border border-white/20 px-3 text-xs font-bold text-white">Start another</button></div></div><p className="mt-3 text-xs text-white/65">{confirmation.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}</p></div>}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start xl:gap-10">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">The menu</p><h2 className="mt-1 text-2xl font-bold text-white">Find your film-time favourite</h2></div><span className="text-xs text-muted">Tap + to add to your cart</span></div>
              <div className="sticky top-[68px] z-30 -mx-4 mb-7 border-y border-white/10 bg-[#171410]/95 px-4 py-3 shadow-[0_10px_20px_rgba(0,0,0,.2)] backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border" aria-label="Food categories">
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold transition ${activeCategory === category ? "bg-gold text-background" : "border border-white/15 bg-card text-white/70 hover:border-gold/60 hover:text-white"}`}>{category}</button>)}
                </div>
              </div>
              <div className="mb-9 grid gap-3 sm:grid-cols-2">
                {menuItems.filter((item) => item.category === activeCategory).map((item) => {
                  const quantity = quantities[item.name] || 0;
                  return <article key={item.name} className="grid min-h-32 grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-2xl border border-white/10 bg-[#1b1915] p-3 transition hover:border-gold/35 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-4">
                    <div className="relative row-span-2 h-24 w-[88px] overflow-hidden rounded-xl bg-gold/10 sm:h-28 sm:w-24" aria-hidden="true"><Image src={item.image} alt="" fill sizes="(max-width: 640px) 96px, 112px" className="object-cover" /></div>
                    <div className="flex min-w-0 flex-1 flex-col"><div className="flex flex-wrap items-start gap-1.5"><h3 className="text-sm font-bold text-white sm:text-base">{item.name}</h3>{item.tag && <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[0.6rem] font-bold text-gold">{item.tag}</span>}</div><p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p></div>
                    <div className="col-start-2 flex justify-end self-end">{quantity ? <div className="flex items-center rounded-lg border border-gold/50 bg-background"><button type="button" onClick={() => changeQuantity(item.name, -1)} aria-label={`Remove one ${item.name}`} className="flex h-11 w-9 items-center justify-center text-lg font-bold text-gold">−</button><span className="w-5 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => changeQuantity(item.name, 1)} aria-label={`Add one ${item.name}`} className="flex h-11 w-9 items-center justify-center text-lg font-bold text-gold">+</button></div> : <button type="button" onClick={() => changeQuantity(item.name, 1)} aria-label={`Add ${item.name}`} className="flex min-h-11 items-center gap-1 rounded-lg border border-gold px-3 text-xs font-bold text-gold transition hover:bg-gold hover:text-background">Add <span className="text-lg leading-none">+</span></button>}</div>
                  </article>;
                })}
              </div>
              <div className="rounded-2xl border border-gold/20 bg-background/55 p-4 sm:p-6">
                <div className="mb-5">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold">Better together</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Make it a movie night</h2>
                  <p className="mt-1 text-xs text-muted">One tap adds both items. Mix and match as you like.</p>
                  <p className="mt-2 text-xs font-semibold text-gold md:hidden">Swipe to see more →</p>
                </div>
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0" aria-label="Movie night pairings" tabIndex={0}>
                  {pairings.map((pairing) => (
                    <div key={pairing.title} className="flex w-[calc(100%-2rem)] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/10 bg-card md:w-auto md:max-w-none md:shrink">
                      <div className="relative h-32 w-full" aria-hidden="true"><Image src={pairing.image} alt="" fill sizes="(max-width: 768px) 90vw, 260px" className="object-cover" /></div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-sm font-bold text-white">{pairing.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{pairing.description}</p>
                        <p className="mt-2 text-xs text-gold/85">{pairing.items.join(" + ")}</p>
                        <div className="mt-auto pt-4">
                          <button type="button" onClick={() => addPairing(pairing.items)} className="min-h-10 w-full rounded-lg border border-gold/60 px-3 text-xs font-bold text-gold transition hover:bg-gold hover:text-background">Add both +</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 px-4 text-xs text-muted sm:px-6">Food photos are illustrative. The items served may look different.</p>
            </div>
            <aside className="hidden rounded-2xl border border-gold/25 bg-[#11100e] p-5 shadow-2xl lg:sticky lg:top-24 lg:block" aria-label="Your cart"><div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Your cart</p><h2 className="mt-1 text-xl font-bold text-white">Your order</h2></div><span className="rounded-full bg-gold px-2.5 py-1 text-sm font-black text-background">{itemCount}</span></div>{cartContents()}<div className="mt-5 border-t border-white/10 pt-5">{orderForm(false)}</div></aside>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-[#11100e]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,.45)] backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}><div className="mx-auto flex max-w-2xl items-center gap-3">{confirmation && itemCount === 0 ? <><div className="min-w-0 flex-1"><p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gold">Order placed</p><p className="truncate text-sm font-semibold text-white">#{confirmation.id} · {confirmation.seat}</p></div><button type="button" onClick={() => setConfirmationOpen(true)} className="btn-gold min-h-11 justify-center px-5">View order</button></> : <><div className="min-w-0 flex-1"><p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gold">Your cart</p><p className="text-sm font-semibold text-white">{itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"} selected` : "0 items"}</p></div><button ref={cartButtonRef} type="button" onClick={() => setCartOpen(true)} className="btn-gold min-h-11 justify-center px-5">View cart <span className="rounded-full bg-background/20 px-1.5">{itemCount}</span></button></>}</div></div>

      {cartOpen && <div className="fixed inset-0 z-[70] lg:hidden" role="presentation"><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="absolute inset-0 bg-black/75" /><div role="dialog" aria-modal="true" aria-labelledby="mobile-cart-title" className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-gold/40 bg-[#11100e] p-5 shadow-2xl sm:mx-auto sm:max-w-xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" /><div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold">Your cart</p><h2 id="mobile-cart-title" className="mt-1 text-xl font-bold text-white">Your order · {itemCount} {itemCount === 1 ? "item" : "items"}</h2></div><button ref={closeRef} type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-white">×</button></div>{cartContents()}<div className="mt-5 border-t border-white/10 pt-5">{orderForm(true)}</div></div></div>}

      {confirmation && confirmationOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title" className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/35 bg-[#171410] p-5 shadow-2xl sm:rounded-3xl sm:p-7" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Order #{confirmation.id}</p><h2 id="order-confirmation-title" className="mt-1 text-2xl font-bold text-white">Order placed</h2><p className="mt-1 text-sm text-white/70">Thank you, {confirmation.customerName}. Your request was sent to cinema staff.</p></div><button ref={confirmationCloseRef} type="button" onClick={() => setConfirmationOpen(false)} aria-label="Close order confirmation" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-xl text-white">×</button></div><div className="mt-5 rounded-xl border border-gold/35 bg-gold/[0.08] p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Your screen and seat</p><p className="mt-1 text-2xl font-bold text-white">{confirmation.seat}</p>{secondsLeft > 0 ? <><p className="mt-3 text-sm text-white/75">Seat changes close in <strong className="text-gold">{secondsLeft}s</strong></p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${Math.min(100, secondsLeft / (confirmation.editWindowMs / 1000) * 100)}%` }} /></div>{editingSeat ? <form onSubmit={saveSeat} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-white">Correct screen and seat<input required maxLength={120} autoFocus value={seatDraft} onChange={(event) => setSeatDraft(event.target.value)} className="order-input" placeholder="For example, Screen 1 · E12" /></label><div className="flex gap-2"><button type="submit" disabled={savingSeat || secondsLeft === 0} className="btn-gold min-h-11 flex-1 justify-center disabled:opacity-50">{savingSeat ? "Saving…" : "Save seat"}</button><button type="button" onClick={() => { setEditingSeat(false); setSeatError(""); }} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-white">Cancel</button></div>{seatError && <p role="alert" className="text-xs text-red-300">{seatError}</p>}</form> : <button type="button" onClick={() => { setSeatDraft(confirmation.seat); setEditingSeat(true); setSeatError(""); }} className="mt-4 min-h-11 rounded-lg border border-gold px-4 text-sm font-bold text-gold">Edit seat number</button>}</> : <p className="mt-3 text-xs text-white/60">The seat edit window has closed.</p>}</div><div className="mt-5"><h3 className="text-sm font-bold uppercase tracking-wide text-white">Your items</h3><ul className="mt-3 space-y-2">{confirmation.items.map((item) => <li key={item.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"><span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg" aria-hidden="true"><Image src={item.image} alt="" fill sizes="48px" className="object-cover" /></span><span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.name}</span><span className="text-sm font-bold text-gold">× {item.quantity}</span></li>)}</ul></div><button type="button" onClick={() => setConfirmationOpen(false)} className="btn-gold mt-4 min-h-11 w-full justify-center">Done</button></div></div>}
    </>
  );
}
