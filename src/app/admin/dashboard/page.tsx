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

  return (
    <main className="min-h-screen bg-[#090c12] text-slate-100 antialiased">
      <AdminNav title="Theater Command Center" />

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6">
        {/* Operations Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live Cinema System</span>
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Operations & Food Service</h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">Manage live auditorium seat deliveries, menu catalog, and movie showtimes.</p>
          </div>

          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs font-medium text-slate-400">
                Synced at <span className="font-bold text-slate-300">{updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setRefreshing(true); void refresh(); }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-sm transition hover:border-amber-500/50 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-amber-400" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{refreshing ? "Syncing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200 shadow-lg">
            <svg className="h-5 w-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!overview && !error && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-800 border-t-amber-400" />
            <p className="mt-4 text-sm font-semibold text-slate-300">Loading live theater operations…</p>
          </div>
        )}

        {overview && (
          <>
            {/* KPI Cards Grid */}
            <section aria-label="Theater Order Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* New Orders */}
              <button
                type="button"
                onClick={() => setQueueView("pending")}
                aria-pressed={queueView === "pending"}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                  queueView === "pending"
                    ? "border-amber-500/80 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30"
                    : "border-slate-800/80 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">New Orders</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white tabular-nums">{newCount}</span>
                  {newCount > 0 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.68rem] font-bold text-amber-300">Needs Prep</span>}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Fresh paid orders awaiting kitchen</p>
              </button>

              {/* Preparing */}
              <button
                type="button"
                onClick={() => setQueueView("preparing")}
                aria-pressed={queueView === "preparing"}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                  queueView === "preparing"
                    ? "border-sky-500/80 bg-gradient-to-br from-sky-500/15 via-slate-900 to-slate-950 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30"
                    : "border-slate-800/80 bg-slate-900/50 hover:border-sky-500/40 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preparing</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white tabular-nums">{preparingCount}</span>
                  {preparingCount > 0 && <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[0.68rem] font-bold text-sky-300">In Kitchen</span>}
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Orders currently being assembled</p>
              </button>

              {/* Completed */}
              <Link
                href="/admin/orders"
                className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white tabular-nums">{overview.orders.completed || 0}</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-300">Fulfilled</span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Total completed seat orders</p>
              </Link>

              {/* Cafe Menu */}
              <Link
                href="/admin/cafe"
                className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all hover:border-amber-500/40 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cafe Menu</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                      <path d="M15 2v19" />
                      <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                      <path d="M9 2v19" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white tabular-nums">{overview.availableProducts}</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.68rem] font-bold text-amber-300">Active</span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-400">Items available for in-seat dining</p>
              </Link>
            </section>

            {/* Main Operations Grid */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              {/* Order Queue Column */}
              <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/40 shadow-xl">
                {/* Queue Header & Filters */}
                <div className="border-b border-slate-800/80 p-5 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Kitchen &amp; Delivery Queue</h3>
                    <p className="mt-0.5 text-xs text-slate-400">Real-time seat orders ready for preparation and delivery.</p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Link
                      href="/admin/orders"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 transition hover:text-amber-300"
                    >
                      <span>Full Order History</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>

                {/* Queue Filter Segmented Bar */}
                <div className="flex gap-2 border-b border-slate-800/80 bg-slate-950/40 px-5 py-3" aria-label="Dashboard order filter">
                  {(["active", "pending", "preparing"] as QueueView[]).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setQueueView(view)}
                      aria-pressed={queueView === view}
                      className={`min-h-8 rounded-lg px-3.5 text-xs font-bold transition-all ${
                        queueView === view
                          ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {view === "active" ? "All Active Queue" : view === "pending" ? `New (${newCount})` : `Preparing (${preparingCount})`}
                    </button>
                  ))}
                </div>

                {/* Order List */}
                {queue.length ? (
                  <div className="divide-y divide-slate-800/60">
                    {queue.map((order) => {
                      const isPending = order.status === "pending";
                      return (
                        <article key={order.id} className="p-5 transition hover:bg-slate-800/25">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            {/* Order Details */}
                            <div className="min-w-0 flex-1 space-y-2">
                              {/* Top Bar: Seat Badge + Order # + Status */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                                    <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                                    <path d="M5 18v2M19 18v2" />
                                  </svg>
                                  <span>{order.seat}</span>
                                </span>

                                <span className="text-xs font-bold text-slate-400">Order #{order.id}</span>

                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                                    isPending
                                      ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                                      : "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                                  }`}
                                >
                                  {isPending ? "New" : "Preparing"}
                                </span>
                              </div>

                              {/* Customer name & Time */}
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="font-semibold text-white">{order.customerName || "Guest Customer"}</span>
                                <span>•</span>
                                <span>{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>•</span>
                                <span className="font-bold text-amber-400">{formatPrice(order.amountPaise)}</span>
                              </div>

                              {/* Items Breakdown in visual chips */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {Array.isArray(order.items) &&
                                  order.items.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200"
                                    >
                                      <span className="font-black text-amber-400">{item.quantity}×</span>
                                      <span className="font-medium">{item.name}</span>
                                      {item.variantName && <span className="text-slate-400">({item.variantName})</span>}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                              {isPending ? (
                                <button
                                  type="button"
                                  disabled={savingId !== null}
                                  onClick={() => void updateStatus(order, "preparing")}
                                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md transition hover:bg-amber-300 disabled:opacity-50"
                                >
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{savingId === order.id ? "Saving…" : "Start Prep"}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={savingId !== null}
                                  onClick={() => void updateStatus(order, "completed")}
                                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md transition hover:bg-emerald-400 disabled:opacity-50"
                                >
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>{savingId === order.id ? "Saving…" : "Delivered"}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={savingId !== null}
                                onClick={() => void updateStatus(order, "cancelled")}
                                className="inline-flex min-h-10 items-center rounded-xl border border-slate-700/80 bg-slate-900 px-3 text-xs font-medium text-slate-300 transition hover:border-rose-900/50 hover:bg-rose-950/30 hover:text-rose-300 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-slate-400">
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="mt-3 text-base font-bold text-white">All caught up!</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {queueView === "active" ? "No active orders waiting in the kitchen queue." : `No ${queueView} orders at the moment.`}
                    </p>
                  </div>
                )}

                {overview.queue.length >= 12 && (
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 text-center">
                    <Link href="/admin/orders" className="text-xs font-bold text-amber-400 hover:underline">
                      Showing first 12 orders · Open full orders page to see complete queue →
                    </Link>
                  </div>
                )}
              </section>

              {/* Management & Quick Links Sidebar */}
              <aside className="space-y-6">
                {/* Management Quick Navigation */}
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Quick Navigation</h3>
                  <div className="mt-4 space-y-2">
                    <Link
                      href="/admin/cafe"
                      className="group flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 transition hover:border-amber-500/50 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                            <path d="M15 2v19" />
                            <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                            <path d="M9 2v19" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-amber-300">Cafe Menu</p>
                          <p className="text-xs text-slate-400">{overview.availableProducts} items configured</p>
                        </div>
                      </div>
                      <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden="true">→</span>
                    </Link>

                    <Link
                      href="/admin/cafe-users"
                      className="group flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 transition hover:border-amber-500/50 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-amber-300">Staff &amp; POS Users</p>
                          <p className="text-xs text-slate-400">{overview.activeStaff} staff members</p>
                        </div>
                      </div>
                      <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden="true">→</span>
                    </Link>

                    <Link
                      href="/admin/movies"
                      className="group flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 p-3.5 transition hover:border-amber-500/50 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect width="20" height="15" x="2" y="7" rx="2" />
                            <path d="m4 7 3-4h3l-3 4" />
                            <path d="m11 7 3-4h3l-3 4" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-amber-300">Movies &amp; Shows</p>
                          <p className="text-xs text-slate-400">{overview.movies.showing} showing · {overview.movies.upcoming} upcoming</p>
                        </div>
                      </div>
                      <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-400" aria-hidden="true">→</span>
                    </Link>
                  </div>

                  <Link
                    href="/cafe/pos"
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="12" x="3" y="4" rx="2" />
                      <line x1="2" x2="22" y1="20" y2="20" />
                    </svg>
                    <span>Launch Cafe POS Terminal</span>
                  </Link>
                </div>

                {/* Theater Info Card */}
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/30 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Auditorium Details</h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    <li className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-400">Screen 1</span>
                      <span className="font-semibold text-white">4K Barco Laser · Dolby Atmos (64 Ch)</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-400">Screen 2</span>
                      <span className="font-semibold text-white">2K Christie · 7.1 Surround</span>
                    </li>
                    <li className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">Online Payments</span>
                      <span className="font-semibold text-emerald-400">Razorpay Integrated</span>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
