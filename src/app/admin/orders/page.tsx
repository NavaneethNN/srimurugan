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

const filterTabs: { value: Filter; label: string; dotColor: string }[] = [
  { value: "active", label: "Active Queue", dotColor: "bg-amber-400" },
  { value: "pending", label: "New", dotColor: "bg-amber-500" },
  { value: "preparing", label: "Preparing", dotColor: "bg-sky-400" },
  { value: "completed", label: "Completed", dotColor: "bg-emerald-400" },
  { value: "cancelled", label: "Cancelled", dotColor: "bg-rose-400" },
  { value: "all", label: "All Orders", dotColor: "bg-slate-400" },
];

function formatOrderTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function formatElapsed(isoString: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  } catch {
    return "";
  }
}

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);
  const browsingHistoryRef = useRef(false);

  const loadOrders = useCallback(async (cursor: number | null = null) => {
    const id = ++requestId.current;
    if (cursor !== null) {
      loadingMoreRef.current = true;
      browsingHistoryRef.current = true;
      setBrowsingHistory(true);
      setLoadingMore(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const params = new URLSearchParams({ status: filter });
      if (cursor !== null) params.set("cursor", String(cursor));
      const response = await fetch(`/api/admin/food-orders?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      if (id !== requestId.current) return;

      setOrders((current) =>
        cursor === null
          ? data.orders
          : [...current, ...data.orders.filter((order: Order) => !current.some((saved) => saved.id === order.id))]
      );
      setCounts(data.counts || {});
      setNextCursor(data.nextCursor);
      setUpdatedAt(new Date());
      setError("");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
        setIsRefreshing(false);
        loadingMoreRef.current = false;
      }
    }
  }, [filter]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadOrders(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !loadingMoreRef.current && !browsingHistoryRef.current) {
        void loadOrders();
      }
    }, 10_000);
    const onVisible = () => {
      if (document.visibilityState === "visible" && !browsingHistoryRef.current) void loadOrders();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      requestId.current += 1;
    };
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? orders.filter(
          (order) =>
            String(order.id).includes(term) ||
            order.seat.toLowerCase().includes(term) ||
            order.customerName?.toLowerCase().includes(term) ||
            order.items?.some((i) => i.name.toLowerCase().includes(term))
        )
      : orders;
  }, [orders, search]);

  async function updateStatus(order: Order, status: "preparing" | "completed" | "cancelled") {
    if (status === "cancelled" && !window.confirm(`Cancel order #${order.id}? The customer will see this status.`)) {
      return;
    }
    setSavingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/food-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
      browsingHistoryRef.current = false;
      setBrowsingHistory(false);
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally {
      setSavingId(null);
    }
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

  function getCountForFilter(val: Filter): number {
    if (val === "active") return activeCount;
    if (val === "all") return Object.values(counts).reduce((s, c) => s + c, 0);
    return counts[val] || 0;
  }

  return (
    <main className="min-h-screen bg-[#090c12] text-slate-100">
      <AdminNav title="Food orders" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Food & Cafe Orders
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {activeCount} Active in Queue
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Only verified, pre-paid online orders appear in this live delivery queue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {updatedAt && (
              <span className="text-xs font-medium text-slate-400">
                Updated {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                browsingHistoryRef.current = false;
                setBrowsingHistory(false);
                void loadOrders();
              }}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-amber-500/50 hover:bg-slate-800 disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 text-amber-400 ${isRefreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{isRefreshing ? "Syncing..." : "Refresh Queue"}</span>
            </button>
          </div>
        </div>

        {/* Informational banner if browsing older history */}
        {browsingHistory && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Auto-refresh is paused while you inspect past orders.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                browsingHistoryRef.current = false;
                setBrowsingHistory(false);
                void loadOrders();
              }}
              className="font-semibold underline hover:text-white"
            >
              Resume Live Mode
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          {/* Scrollable Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Order status filter">
            {filterTabs.map((item) => {
              const count = getCountForFilter(item.value);
              const isSelected = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => chooseFilter(item.value)}
                  aria-pressed={isSelected}
                  className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-slate-950" : item.dotColor}`} />
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      isSelected
                        ? "bg-slate-950/20 text-slate-950"
                        : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 sm:w-72">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label className="sr-only" htmlFor="order-search">Search orders</label>
            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search seat, #id, or guest..."
              className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-9 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading && orders.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading orders queue...</p>
            <p className="mt-1 text-xs text-slate-400">Connecting to Sri Murugan Cinema order stream</p>
          </div>
        ) : visibleOrders.length ? (
          <div className="grid gap-4">
            {visibleOrders.map((order) => {
              const isPending = order.status === "pending";
              const isPreparing = order.status === "preparing";
              const isCompleted = order.status === "completed";
              const isCancelled = order.status === "cancelled";

              return (
                <article
                  key={order.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900/90 to-[#0c101a] p-5 shadow-lg transition duration-200 hover:border-slate-700/80 ${
                    isPending
                      ? "border-amber-500/40 ring-1 ring-amber-500/20"
                      : isPreparing
                      ? "border-sky-500/40"
                      : isCompleted
                      ? "border-emerald-500/20"
                      : "border-slate-800/80 opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: Seat info & Metadata */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Order ID */}
                        <span className="font-mono text-sm font-bold text-amber-400">
                          #{order.id}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : isPreparing
                              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPending
                                ? "bg-amber-400 animate-pulse"
                                : isPreparing
                                ? "bg-sky-400 animate-pulse"
                                : isCompleted
                                ? "bg-emerald-400"
                                : "bg-rose-400"
                            }`}
                          />
                          {isPending ? "New Order" : order.status}
                        </span>

                        {/* Relative Elapsed Timer */}
                        <span className="text-xs text-slate-400 font-medium">
                          • {formatElapsed(order.createdAt)} ({formatOrderTime(order.createdAt)})
                        </span>
                      </div>

                      {/* Primary Destination: Seat Highlight */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 shadow-sm">
                          <svg
                            className="h-4 w-4 shrink-0 text-amber-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                            <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
                            <path d="M5 18v2" />
                            <path d="M19 18v2" />
                          </svg>
                          <span className="text-sm font-bold text-amber-200">
                            {order.seat}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          Recipient:{" "}
                          <strong className="text-slate-200">
                            {order.customerName?.trim() || "Guest"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Payment & Action Buttons */}
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:items-end">
                      {/* Price Pill */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Paid</p>
                        <p className="text-base font-extrabold text-amber-400">
                          {formatPrice(order.amountPaise)}
                        </p>
                      </div>

                      {/* Interactive Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            disabled={savingId === order.id}
                            onClick={() => void updateStatus(order, "preparing")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{savingId === order.id ? "Saving..." : "Start Prep"}</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            type="button"
                            disabled={savingId === order.id}
                            onClick={() => void updateStatus(order, "completed")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{savingId === order.id ? "Saving..." : "Mark Delivered"}</span>
                          </button>
                        )}

                        {(isPending || isPreparing) && (
                          <button
                            type="button"
                            disabled={savingId === order.id}
                            onClick={() => void updateStatus(order, "cancelled")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Ordered List */}
                  <div className="mt-4 border-t border-slate-800/80 pt-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Food & Beverage Items ({order.items?.reduce((s, i) => s + i.quantity, 0) || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(order.items) &&
                        order.items.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/20 font-bold text-amber-300">
                              {item.quantity}×
                            </span>
                            <span className="font-semibold text-slate-200">
                              {item.name}
                            </span>
                            {item.variantName && (
                              <span className="rounded-md border border-slate-700/80 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-300">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Footer metadata: Payment ID */}
                  {order.razorpayPaymentId && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                      <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <span>Razorpay ID:</span>
                      <code className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                        {order.razorpayPaymentId}
                      </code>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">
              <svg className="h-8 w-8 text-amber-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {search ? "No matching orders found" : "No orders in this view"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {search
                ? `No orders matched "${search}". Try searching by order number, guest name, or screen.`
                : "When customers order from their seats via the QR menu, confirmed orders will display here automatically."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Next Cursor / Load More Button */}
        {nextCursor && (
          <div className="mt-8 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadOrders(nextCursor)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-6 py-2.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-amber-500/50 hover:bg-slate-800 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  </svg>
                  <span>Loading older orders...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Load More Orders</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
