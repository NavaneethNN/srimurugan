"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { formatPrice } from "@/lib/foodMenu";

type QueueOrder = {
  id: number;
  seat: string;
  customerName: string | null;
  status: string;
  amountPaise: number | null;
  createdAt: string;
  items: { name: string; variantName?: string; quantity: number }[];
};
type Overview = {
  orders: Record<string, number>;
  queue: QueueOrder[];
  movies: { showing: number; upcoming: number };
  activeStaff: number;
  availableProducts: number;
};
type QueueView = "active" | "pending" | "preparing";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queueView, setQueueView] = useState<QueueView>("active");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const requestId = useRef(0);
  const savingRef = useRef(false);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the dashboard.");
      if (id !== requestId.current) return;
      setOverview(data);
      setUpdatedAt(new Date());
      setError("");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Could not load the dashboard.");
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && !savingRef.current) void refresh(); }, 10_000);
    const onVisible = () => { if (document.visibilityState === "visible" && !savingRef.current) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); requestId.current += 1; };
  }, [refresh]);

  async function updateStatus(order: QueueOrder, next: "preparing" | "completed" | "cancelled") {
    if (next === "cancelled" && !window.confirm(`Cancel order #${order.id}? The customer will see this status.`)) return;
    requestId.current += 1;
    savingRef.current = true;
    setRefreshing(false);
    setSavingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/food-orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the order.");
      setOverview((current) => {
        if (!current) return current;
        const counts = { ...current.orders };
        counts[order.status] = Math.max(0, (counts[order.status] || 0) - 1);
        counts[next] = (counts[next] || 0) + 1;
        return {
          ...current,
          orders: counts,
          queue: next === "preparing"
            ? current.queue.map((item) => item.id === order.id ? { ...item, status: next } : item)
            : current.queue.filter((item) => item.id !== order.id),
        };
      });
      await refresh();
    } catch (cause) {
      await refresh();
      setError(cause instanceof Error ? cause.message : "Could not update the order.");
    } finally { savingRef.current = false; setSavingId(null); }
  }

  const newCount = overview?.orders.pending || 0;
  const preparingCount = overview?.orders.preparing || 0;
  const queue = overview?.queue.filter((order) => queueView === "active" || order.status === queueView) || [];
  const management = overview ? [
    { label: "Cafe menu", detail: `${overview.availableProducts} available products`, href: "/admin/cafe" },
    { label: "Staff access", detail: `${overview.activeStaff} active staff`, href: "/admin/cafe-users" },
    { label: "Movies", detail: `${overview.movies.showing} showing · ${overview.movies.upcoming} upcoming`, href: "/admin/movies" },
  ] : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav title="Dashboard" />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-2xl font-semibold">Cafe operations</h2><p className="mt-1 text-sm text-slate-400">Process paid orders here. Menu, staff, and movie controls are one click away.</p></div>
          <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button type="button" onClick={() => { setRefreshing(true); void refresh(); }} disabled={refreshing} className="min-h-9 rounded-md border border-slate-700 px-3 text-sm hover:bg-slate-800 disabled:opacity-50">{refreshing ? "Refreshing…" : "Refresh"}</button></div>
        </div>
        {error && <p role="alert" className="rounded-md border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {!overview && !error && <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-12 text-center text-sm text-slate-400">Loading dashboard…</p>}
        {overview && <>
          <section aria-label="Order summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => setQueueView("pending")} aria-pressed={queueView === "pending"} className={`rounded-lg border p-4 text-left hover:bg-slate-900 ${queueView === "pending" ? "border-slate-400 bg-slate-900" : "border-slate-800 bg-slate-900/50"}`}><span className="text-sm text-slate-400">New orders</span><strong className="mt-2 block text-3xl font-semibold tabular-nums">{newCount}</strong><span className="mt-1 block text-xs text-slate-500">Need attention</span></button>
            <button type="button" onClick={() => setQueueView("preparing")} aria-pressed={queueView === "preparing"} className={`rounded-lg border p-4 text-left hover:bg-slate-900 ${queueView === "preparing" ? "border-slate-400 bg-slate-900" : "border-slate-800 bg-slate-900/50"}`}><span className="text-sm text-slate-400">Preparing</span><strong className="mt-2 block text-3xl font-semibold tabular-nums">{preparingCount}</strong><span className="mt-1 block text-xs text-slate-500">In progress</span></button>
            <Link href="/admin/orders" className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900"><span className="text-sm text-slate-400">Completed orders</span><strong className="mt-2 block text-3xl font-semibold tabular-nums">{overview.orders.completed || 0}</strong><span className="mt-1 block text-xs text-slate-500">All time</span></Link>
            <Link href="/admin/cafe" className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900"><span className="text-sm text-slate-400">Available products</span><strong className="mt-2 block text-3xl font-semibold tabular-nums">{overview.availableProducts}</strong><span className="mt-1 block text-xs text-slate-500">Cafe menu</span></Link>
          </section>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,.8fr)]">
            <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3"><div><h3 className="font-semibold">Live order queue</h3><p className="mt-0.5 text-xs text-slate-400">New paid orders first, then orders in preparation</p></div><Link href="/admin/orders" className="text-sm font-medium underline underline-offset-4">View full queue →</Link></div>
              <div className="flex gap-1 border-b border-slate-800 px-3 py-2" aria-label="Dashboard order filter">{(["active", "pending", "preparing"] as QueueView[]).map((view) => <button key={view} type="button" onClick={() => setQueueView(view)} aria-pressed={queueView === view} className={`min-h-8 rounded-md px-3 text-xs font-medium ${queueView === view ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:bg-slate-800"}`}>{view === "active" ? "All active" : view === "pending" ? "New" : "Preparing"}</button>)}</div>
              {queue.length ? <div className="divide-y divide-slate-800">{queue.map((order) => <article key={order.id} className="px-4 py-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold tabular-nums">#{order.id}</span><span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${order.status === "pending" ? "bg-amber-950/60 text-amber-200" : "bg-slate-800 text-slate-300"}`}>{order.status === "pending" ? "New" : "Preparing"}</span></div><p className="mt-1 truncate text-sm">{order.seat} · {order.customerName || "Guest"}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {formatPrice(order.amountPaise)}</p></div><div className="flex gap-2">{order.status === "pending" ? <button type="button" disabled={savingId !== null} onClick={() => void updateStatus(order, "preparing")} className="min-h-9 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === order.id ? "Saving…" : "Start preparing"}</button> : <button type="button" disabled={savingId !== null} onClick={() => void updateStatus(order, "completed")} className="min-h-9 rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-950 hover:bg-white disabled:opacity-50">{savingId === order.id ? "Saving…" : "Mark complete"}</button>}<button type="button" disabled={savingId !== null} onClick={() => void updateStatus(order, "cancelled")} className="min-h-9 rounded-md border border-slate-700 px-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">Cancel</button></div></div><p className="mt-2 truncate text-xs text-slate-400">{Array.isArray(order.items) ? order.items.map((item) => `${item.quantity} × ${item.name}${item.variantName ? ` (${item.variantName})` : ""}`).join(" · ") : ""}</p></article>)}</div> : <p className="px-4 py-10 text-center text-sm text-slate-400">{queueView === "active" ? "No active paid orders." : `No ${queueView === "pending" ? "new" : "preparing"} orders in this view.`}</p>}
              {overview.queue.length >= 12 && <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">Showing the first 12 active orders. Open the full queue to see more.</p>}
            </section>
            <aside className="space-y-5"><section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"><h3 className="font-semibold">Management</h3><div className="mt-3 divide-y divide-slate-800 border-y border-slate-800">{management.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 py-3 hover:text-white"><span><span className="block text-sm font-medium">{item.label}</span><span className="text-xs text-slate-400">{item.detail}</span></span><span aria-hidden="true" className="text-slate-500">→</span></Link>)}</div><Link href="/cafe/pos" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-700 text-sm font-medium hover:bg-slate-800">Open cafe POS</Link></section><section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4"><h3 className="text-sm font-semibold">Order handling</h3><p className="mt-2 text-xs leading-5 text-slate-400">Only captured payments enter this queue. Status changes are shown to the customer on their order page.</p></section></aside>
          </div>
        </>}
      </div>
    </main>
  );
}
