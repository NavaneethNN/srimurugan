"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/foodMenu";

type Status = "pending" | "preparing" | "completed" | "cancelled" | "all";
type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; unitPricePaise?: number | null; quantity: number }[];
  status: string;
  paymentStatus: string;
  amountPaise: number | null;
  razorpayPaymentId: string | null;
  createdAt: string;
};
const filters: Status[] = ["pending", "preparing", "completed", "cancelled", "all"];
const editableStatuses = filters.filter((status) => status !== "all");

export default function FoodOrdersPage() {
  const [filter, setFilter] = useState<Status>("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const requestId = useRef(0);

  const loadOrders = useCallback(async (cursor: number | null = null) => {
    const currentRequest = ++requestId.current;
    if (cursor) setLoadingMore(true);
    try {
      const params = new URLSearchParams({ status: filter });
      if (cursor) params.set("cursor", String(cursor));
      const response = await fetch(`/api/admin/food-orders?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      if (currentRequest !== requestId.current) return;
      setOrders((current) => cursor ? [...current, ...data.orders.filter((order: Order) => !current.some((saved) => saved.id === order.id))] : data.orders);
      setCounts(data.counts || {});
      setNextCursor(data.nextCursor);
      setError("");
    } catch (cause) {
      if (currentRequest === requestId.current) setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
    const interval = window.setInterval(() => void loadOrders(), 10000);
    return () => { window.clearInterval(interval); requestId.current += 1; };
  }, [loadOrders]);

  const updateStatus = async (id: number, status: string) => {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/food-orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((order) => order.id === id ? data.order : order));
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-gold">Sri Murugan Cinema</p><h1 className="mt-1 text-3xl font-bold">Food orders</h1><p className="mt-2 text-sm text-muted">Oldest open orders first. Queue refreshes every 10 seconds.</p></div>
          <Link href="/admin" className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold">← Admin panel</Link>
        </div>
        {error && <p role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" aria-label="Order status filter">
            {filters.map((status) => <button key={status} type="button" onClick={() => { if (status === filter) return; setFilter(status); setLoading(true); setOrders([]); setNextCursor(null); }} aria-pressed={filter === status} className={`min-h-10 rounded-lg px-3 text-sm font-semibold capitalize ${filter === status ? "bg-gold text-white" : "border border-white/20 text-white"}`}>{status} {status !== "all" && <span className="ml-1 opacity-75">{counts[status] || 0}</span>}</button>)}
          </div>
          <button type="button" onClick={() => void loadOrders()} className="min-h-10 rounded-lg border border-white/20 px-4 text-sm text-white hover:border-gold">Refresh</button>
        </div>
        {loading ? <p className="text-muted">Loading orders…</p> : orders.length ? <div className="grid gap-4 md:grid-cols-2">{orders.map((order) => <article key={order.id} className="rounded-xl border border-white/15 bg-card p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Order #{order.id}</p><h2 className="mt-1 text-lg font-bold">{order.seat}</h2><p className="text-xs text-muted">{order.customerName || "Guest"} · {new Date(order.createdAt).toLocaleString("en-IN")}</p><p className="mt-2 text-xs font-semibold text-gold">{order.paymentStatus === "paid" ? `Paid online · ${formatPrice(order.amountPaise)}` : "Legacy order · payment unverified"}</p>{order.razorpayPaymentId && <p className="mt-1 break-all text-[.65rem] text-muted">Payment ID: {order.razorpayPaymentId}</p>}</div><span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold capitalize text-gold">{order.status}</span></div>
          <ul className="my-5 space-y-2 border-y border-white/10 py-4 text-sm">{Array.isArray(order.items) && order.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-3"><span>{item.name}{item.variantName ? ` · ${item.variantName}` : ""}{typeof item.unitPricePaise === "number" ? <small className="ml-2 text-muted">{formatPrice(item.unitPricePaise)}</small> : null}</span><span className="font-bold text-gold">× {item.quantity}</span></li>)}</ul>
          <label className="block text-xs font-semibold text-muted">Order status<select value={order.status} disabled={savingId === order.id} onChange={(event) => void updateStatus(order.id, event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-background p-3 text-sm text-white outline-none focus:border-gold">{editableStatuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
        </article>)}</div> : <p className="rounded-xl border border-dashed border-gold/25 p-10 text-center text-sm text-muted">No {filter === "all" ? "" : `${filter} `}food orders.</p>}
        {nextCursor && <div className="mt-6 text-center"><button type="button" disabled={loadingMore} onClick={() => void loadOrders(nextCursor)} className="min-h-11 rounded-lg border border-gold px-5 text-sm font-bold text-gold disabled:opacity-50">{loadingMore ? "Loading…" : "Load more orders"}</button></div>}
      </div>
    </main>
  );
}
