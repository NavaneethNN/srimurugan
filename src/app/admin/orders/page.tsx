"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { formatPrice } from "@/lib/foodMenu";

type Filter = "active" | "pending" | "preparing" | "completed" | "cancelled" | "all";
type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; quantity: number }[];
  status: string;
  amountPaise: number | null;
  razorpayPaymentId: string | null;
  createdAt: string;
};
const filters: { value: Filter; label: string }[] = [
  { value: "active", label: "Active" }, { value: "pending", label: "New" },
  { value: "preparing", label: "Preparing" }, { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }, { value: "all", label: "All" },
];

export default function FoodOrdersPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [browsingHistory, setBrowsingHistory] = useState(false);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);
  const browsingHistoryRef = useRef(false);

  const loadOrders = useCallback(async (cursor: number | null = null) => {
    const id = ++requestId.current;
    if (cursor !== null) { loadingMoreRef.current = true; browsingHistoryRef.current = true; setBrowsingHistory(true); setLoadingMore(true); }
    try {
      const params = new URLSearchParams({ status: filter });
      if (cursor !== null) params.set("cursor", String(cursor));
      const response = await fetch(`/api/admin/food-orders?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      if (id !== requestId.current) return;
      setOrders((current) => cursor === null ? data.orders : [...current, ...data.orders.filter((order: Order) => !current.some((saved) => saved.id === order.id))]);
      setCounts(data.counts || {});
      setNextCursor(data.nextCursor);
      setUpdatedAt(new Date());
      setError("");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      if (id === requestId.current) { setLoading(false); setLoadingMore(false); loadingMoreRef.current = false; }
    }
  }, [filter]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadOrders(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !loadingMoreRef.current && !browsingHistoryRef.current) void loadOrders(); }, 10_000);
    const onVisible = () => { if (document.visibilityState === "visible" && !browsingHistoryRef.current) void loadOrders(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); requestId.current += 1; };
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? orders.filter((order) => String(order.id).includes(term) || order.seat.toLowerCase().includes(term) || order.customerName?.toLowerCase().includes(term)) : orders;
  }, [orders, search]);

  async function updateStatus(order: Order, status: "preparing" | "completed" | "cancelled") {
    if (status === "cancelled" && !window.confirm(`Cancel order #${order.id}? The customer will see this status.`)) return;
    setSavingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/food-orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((item) => item.id === order.id ? data.order : item));
      browsingHistoryRef.current = false;
      setBrowsingHistory(false);
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally { setSavingId(null); }
  }

  function chooseFilter(next: Filter) {
    if (next === filter) return;
    loadingMoreRef.current = false;
    browsingHistoryRef.current = false;
    setBrowsingHistory(false);
    setLoadingMore(false);
    setFilter(next);
    setSearch("");
    setOrders([]);
    setNextCursor(null);
    setLoading(true);
  }

  const activeCount = (counts.pending || 0) + (counts.preparing || 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav title="Food orders" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Order queue</h2><p className="mt-1 text-sm text-slate-400">Only confirmed paid orders appear here. {browsingHistory ? "Auto refresh is paused while you browse older orders." : "The queue refreshes while this page is open."}</p></div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button type="button" onClick={() => { browsingHistoryRef.current = false; setBrowsingHistory(false); void loadOrders(); }} className="min-h-9 rounded-md border border-slate-700 px-3 text-sm hover:bg-slate-800">Refresh</button></div></div>
        {error && <p role="alert" className="mb-4 rounded-md border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex gap-1 overflow-x-auto" aria-label="Order status filter">{filters.map((item) => <button key={item.value} type="button" onClick={() => chooseFilter(item.value)} aria-pressed={filter === item.value} className={`min-h-9 shrink-0 rounded-md px-3 text-sm ${filter === item.value ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{item.label}<span className="ml-1.5 tabular-nums opacity-70">{item.value === "active" ? activeCount : item.value === "all" ? Object.values(counts).reduce((sum, value) => sum + value, 0) : counts[item.value] || 0}</span></button>)}</div>
          <label className="sr-only" htmlFor="order-search">Search loaded orders</label><input id="order-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order #, customer or seat" className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm outline-none focus:border-slate-400 sm:w-64" />
        </div>
        {loading && orders.length === 0 ? <p className="py-16 text-center text-sm text-slate-400">Loading orders…</p> : visibleOrders.length ? <div className="mt-4 space-y-2">{visibleOrders.map((order) => <article key={order.id} className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold tabular-nums">Order #{order.id}</h3><span className={`rounded px-2 py-0.5 text-xs font-medium ${order.status === "pending" ? "bg-amber-950/60 text-amber-200" : "bg-slate-800 text-slate-300"}`}>{order.status === "pending" ? "New" : order.status[0].toUpperCase() + order.status.slice(1)}</span></div><p className="mt-1 text-sm text-slate-200">{order.seat} · {order.customerName || "Guest"}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleString("en-IN")} · Paid {formatPrice(order.amountPaise)}</p></div><div className="flex flex-wrap gap-2">{order.status === "pending" && <button type="button" disabled={savingId === order.id} onClick={() => void updateStatus(order, "preparing")} className="min-h-9 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === order.id ? "Saving…" : "Start preparing"}</button>}{order.status === "preparing" && <button type="button" disabled={savingId === order.id} onClick={() => void updateStatus(order, "completed")} className="min-h-9 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === order.id ? "Saving…" : "Mark complete"}</button>}{(order.status === "pending" || order.status === "preparing") && <button type="button" disabled={savingId === order.id} onClick={() => void updateStatus(order, "cancelled")} className="min-h-9 rounded-md border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">Cancel</button>}</div></div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-sm text-slate-300">{Array.isArray(order.items) && order.items.map((item, index) => <span key={`${item.name}-${index}`}>{item.quantity} × {item.name}{item.variantName ? ` · ${item.variantName}` : ""}</span>)}</div>
          {order.razorpayPaymentId && <p className="mt-2 break-all text-[11px] text-slate-500">Payment ID: {order.razorpayPaymentId}</p>}
        </article>)}</div> : <p className="py-16 text-center text-sm text-slate-400">{search ? "No loaded orders match your search." : "No orders in this view."}</p>}
        {nextCursor && <div className="mt-5 text-center"><button type="button" disabled={loadingMore} onClick={() => void loadOrders(nextCursor)} className="min-h-10 rounded-md border border-slate-700 px-4 text-sm hover:bg-slate-800 disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button></div>}
      </div>
    </main>
  );
}
