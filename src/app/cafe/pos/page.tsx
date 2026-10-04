"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/foodMenu";

type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; quantity: number }[];
  status: string;
  amountPaise: number | null;
  createdAt: string;
};
type View = "all" | "pending" | "preparing";

export default function CafePOSPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noticeId, setNoticeId] = useState<number | null>(null);
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);
  const knownIds = useRef(new Set<number>());
  const noticeQueue = useRef<number[]>([]);
  const activeNoticeId = useRef<number | null>(null);

  const showNextNotice = useCallback((active: Order[]) => {
    if (activeNoticeId.current !== null) return;
    noticeQueue.current = noticeQueue.current.filter((id) => active.some((order) => order.id === id && order.status === "pending"));
    const next = noticeQueue.current.shift();
    if (next === undefined) return;
    activeNoticeId.current = next;
    setNoticeId(next);
  }, []);

  const loadOrders = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/cafe/food-orders?status=active&limit=100", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { router.replace("/cafe/login"); return; }
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      if (id !== requestId.current) return;
      const active = (data.orders as Order[]).slice().sort((a, b) =>
        Number(b.status === "pending") - Number(a.status === "pending") || a.id - b.id);
      if (hasLoaded.current) for (const order of active) {
        if (order.status === "pending" && !knownIds.current.has(order.id)) noticeQueue.current.push(order.id);
      }
      for (const order of active) knownIds.current.add(order.id);
      hasLoaded.current = true;
      if (activeNoticeId.current !== null && !active.some((order) => order.id === activeNoticeId.current && order.status === "pending")) {
        activeNoticeId.current = null;
        setNoticeId(null);
      }
      showNextNotice(active);
      setOrders(active);
      setCounts(data.counts || {});
      setHasMore(data.nextCursor !== null);
      setUpdatedAt(new Date());
      setError("");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [router, showNextNotice]);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/cafe/session", { cache: "no-store" });
        if (!response.ok) { router.replace("/cafe/login"); return; }
        const data = await response.json();
        setUser(data.user);
      } catch { router.replace("/cafe/login"); }
    }
    const initial = window.setTimeout(() => { void checkSession(); void loadOrders(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void loadOrders(); }, 3_000);
    const onVisible = () => { if (document.visibilityState === "visible") void loadOrders(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); requestId.current += 1; };
  }, [loadOrders, router]);

  const selectedOrder = orders.find((order) => order.id === selectedId) || null;
  const noticeOrder = orders.find((order) => order.id === noticeId) || null;
  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => (view === "all" || order.status === view) &&
      (!term || String(order.id).includes(term) || order.seat.toLowerCase().includes(term) || order.customerName?.toLowerCase().includes(term)));
  }, [orders, view, search]);

  function dismissNotice() {
    activeNoticeId.current = null;
    setNoticeId(null);
    showNextNotice(orders);
  }

  async function updateStatus(order: Order, next: "preparing" | "completed" | "cancelled") {
    if (next === "cancelled" && !window.confirm(`Cancel order #${order.id}? The customer will see this status.`)) return;
    setSavingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/cafe/food-orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((item) => item.id === order.id ? data.order : item));
      if (next === "completed" || next === "cancelled") setSelectedId(null);
      if (activeNoticeId.current === order.id) dismissNotice();
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally { setSavingId(null); }
  }

  async function logout() {
    await fetch("/api/cafe/auth", { method: "DELETE" });
    router.replace("/cafe/login");
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Sri Murugan Cinema</p><h1 className="text-lg font-semibold">Cafe POS</h1></div><div className="flex items-center gap-3 text-sm"><span className="text-slate-400">{user?.name || "Staff"}</span><button type="button" onClick={() => void logout()} className="min-h-9 rounded-md border border-slate-700 px-3 hover:bg-slate-800">Sign out</button></div></div></header>
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><span className="rounded-md border border-slate-700 px-3 py-2 text-sm"><strong className="tabular-nums">{counts.pending || 0}</strong> new</span><span className="rounded-md border border-slate-700 px-3 py-2 text-sm"><strong className="tabular-nums">{counts.preparing || 0}</strong> preparing</span></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button type="button" onClick={() => void loadOrders()} className="min-h-9 rounded-md border border-slate-700 px-3 text-sm hover:bg-slate-800">Refresh</button></div></div>
        {error && <p role="alert" className="mb-4 rounded-md border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {hasMore && <p className="mb-4 rounded-md border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">More than 100 active orders are waiting. Ask an administrator to review the full queue.</p>}
        <div className="grid min-h-[65vh] gap-4 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <section aria-label="Active orders" className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50"><div className="border-b border-slate-800 p-3"><div className="flex gap-1">{(["all", "pending", "preparing"] as View[]).map((item) => <button type="button" key={item} onClick={() => setView(item)} aria-pressed={view === item} className={`min-h-9 flex-1 rounded-md px-2 text-sm capitalize ${view === item ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-400 hover:bg-slate-800"}`}>{item === "pending" ? "New" : item}</button>)}</div><label htmlFor="pos-search" className="sr-only">Search orders</label><input id="pos-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order #, customer or seat" className="mt-3 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-slate-400" /></div>
            {loading && orders.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">Loading orders…</p> : visibleOrders.length ? <div className="max-h-[70vh] divide-y divide-slate-800 overflow-y-auto">{visibleOrders.map((order) => <button type="button" key={order.id} onClick={() => setSelectedId(order.id)} aria-pressed={selectedId === order.id} className={`w-full px-4 py-3 text-left hover:bg-slate-800 ${selectedId === order.id ? "bg-slate-800" : ""}`}><div className="flex items-center justify-between gap-2"><span className="font-semibold tabular-nums">#{order.id} · {order.seat}</span><span className={`rounded px-2 py-0.5 text-xs ${order.status === "pending" ? "bg-amber-950/60 text-amber-200" : "bg-slate-700 text-slate-200"}`}>{order.status === "pending" ? "New" : "Preparing"}</span></div><p className="mt-1 truncate text-xs text-slate-400">{order.customerName || "Guest"} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items · {formatPrice(order.amountPaise)}</p></button>)}</div> : <p className="p-8 text-center text-sm text-slate-400">No orders in this view.</p>}
          </section>
          <section aria-label="Selected order" className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 sm:p-6">{selectedOrder ? <><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order #{selectedOrder.id}</p><h2 className="mt-1 text-2xl font-semibold">{selectedOrder.seat}</h2><p className="mt-1 text-sm text-slate-400">{selectedOrder.customerName || "Guest"} · {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</p></div><span className="rounded-md border border-slate-700 px-3 py-1.5 text-sm capitalize">{selectedOrder.status}</span></div><div className="divide-y divide-slate-800">{selectedOrder.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-4 py-3 text-sm"><span>{item.name}{item.variantName ? <span className="text-slate-400"> · {item.variantName}</span> : null}</span><strong className="tabular-nums">× {item.quantity}</strong></div>)}</div><div className="flex items-center justify-between border-t border-slate-800 py-4"><span className="text-sm text-slate-400">Paid total</span><strong className="text-xl tabular-nums">{formatPrice(selectedOrder.amountPaise)}</strong></div><div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">{selectedOrder.status === "pending" && <button type="button" disabled={savingId === selectedOrder.id} onClick={() => void updateStatus(selectedOrder, "preparing")} className="min-h-11 rounded-md bg-slate-100 px-5 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === selectedOrder.id ? "Saving…" : "Accept & start preparing"}</button>}{selectedOrder.status === "preparing" && <button type="button" disabled={savingId === selectedOrder.id} onClick={() => void updateStatus(selectedOrder, "completed")} className="min-h-11 rounded-md bg-slate-100 px-5 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === selectedOrder.id ? "Saving…" : "Mark complete"}</button>}<button type="button" disabled={savingId === selectedOrder.id} onClick={() => void updateStatus(selectedOrder, "cancelled")} className="min-h-11 rounded-md border border-slate-700 px-4 text-sm hover:bg-slate-800 disabled:opacity-50">Cancel order</button></div></> : <div className="flex min-h-60 items-center justify-center text-center text-sm text-slate-400">Select an order from the queue to view and update it.</div>}</section>
        </div>
      </div>
      {noticeOrder && <aside role="status" className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),360px)] rounded-lg border border-amber-700 bg-slate-900 p-4 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-amber-300">New paid order</p><p className="mt-1 text-lg font-semibold">#{noticeOrder.id} · {noticeOrder.seat}</p><p className="mt-1 text-sm text-slate-400">{noticeOrder.customerName || "Guest"} · {formatPrice(noticeOrder.amountPaise)}</p></div><button type="button" onClick={dismissNotice} aria-label="Dismiss new order notice" className="rounded px-2 text-xl text-slate-400 hover:text-white">×</button></div><button type="button" onClick={() => { setSelectedId(noticeOrder.id); void updateStatus(noticeOrder, "preparing"); }} disabled={savingId === noticeOrder.id} className="mt-4 min-h-11 w-full rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === noticeOrder.id ? "Saving…" : "Accept & start preparing"}</button></aside>}
    </main>
  );
}
