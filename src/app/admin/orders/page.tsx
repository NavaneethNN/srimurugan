"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { formatPrice } from "@/lib/foodMenu";
import KitchenOrderTicketModal, { KotOrder } from "@/components/KitchenOrderTicket";

type Filter = "active" | "pending" | "preparing" | "completed" | "cancelled" | "all";

export type OrderStatusLog = {
  action: "placed" | "accepted" | "completed" | "cancelled" | "seat_updated";
  status: string;
  actorType: "customer" | "staff" | "admin" | "system";
  actorName: string;
  actorId?: number;
  timestamp: string;
  note?: string;
};

type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; quantity: number }[];
  status: string;
  amountPaise: number | null;
  razorpayPaymentId: string | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  completedBy?: string | null;
  completedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  statusLogs?: OrderStatusLog[] | null;
  createdAt: string;
};

const filterTabs: { value: Filter; label: string; dotColor: string }[] = [
  { value: "active", label: "Active Queue", dotColor: "bg-[#e8be6a]" },
  { value: "pending", label: "New", dotColor: "bg-[#c9993a]" },
  { value: "preparing", label: "Preparing", dotColor: "bg-sky-400" },
  { value: "completed", label: "Completed", dotColor: "bg-emerald-400" },
  { value: "cancelled", label: "Cancelled", dotColor: "bg-rose-400" },
  { value: "all", label: "All Orders", dotColor: "bg-[#b8b2aa]" },
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

function getOrderTimeline(order: Order): OrderStatusLog[] {
  if (Array.isArray(order.statusLogs) && order.statusLogs.length > 0) {
    return order.statusLogs;
  }
  const events: OrderStatusLog[] = [
    {
      action: "placed",
      status: "pending",
      actorType: "customer",
      actorName: order.customerName?.trim() || "Customer",
      timestamp: order.createdAt,
      note: `Order placed online · Delivering to ${order.seat}`,
    },
  ];

  if (order.acceptedBy && order.acceptedAt) {
    events.push({
      action: "accepted",
      status: "preparing",
      actorType: "staff",
      actorName: order.acceptedBy,
      timestamp: order.acceptedAt,
      note: `Accepted & prep started by ${order.acceptedBy}`,
    });
  }

  if (order.completedBy && order.completedAt) {
    events.push({
      action: "completed",
      status: "completed",
      actorType: "staff",
      actorName: order.completedBy,
      timestamp: order.completedAt,
      note: `Fulfilled & delivered by ${order.completedBy}`,
    });
  }

  if (order.cancelledBy && order.cancelledAt) {
    events.push({
      action: "cancelled",
      status: "cancelled",
      actorType: "staff",
      actorName: order.cancelledBy,
      timestamp: order.cancelledAt,
      note: `Cancelled by ${order.cancelledBy}`,
    });
  }

  return events;
}

export default function FoodOrdersPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [printOrder, setPrintOrder] = useState<KotOrder | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [browsingHistory, setBrowsingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});

  const toggleLogs = (id: number) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
    <main className="min-h-screen bg-[#080808] text-[#f4efe8]">
      <AdminNav title="Auditorium Order Queue" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Food &amp; Beverage Delivery
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9993a]/40 bg-[#c9993a]/10 px-3 py-1 text-xs font-bold text-[#e8be6a]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e8be6a] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c9993a]" />
                </span>
                {activeCount} Active in Queue
              </span>
            </div>
            <p className="mt-0.5 font-dancing text-lg text-[#c9993a]">
              Direct-to-seat hot food &amp; snack delivery monitoring
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {updatedAt && (
              <span className="text-xs font-medium text-[#b8b2aa]">
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
              className="inline-flex items-center gap-2 rounded-xl border border-[#2c2820] bg-[#111010] px-3.5 py-2 text-xs font-semibold text-[#f4efe8] shadow-sm transition hover:border-[#c9993a]/60 hover:bg-[#161410] disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 text-[#e8be6a] ${isRefreshing ? "animate-spin" : ""}`}
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
          <div className="mb-5 flex items-center justify-between rounded-xl border border-sky-500/40 bg-sky-950/30 px-4 py-3 text-xs text-sky-200">
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
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#222018] bg-[#111010]/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
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
                      ? "bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] text-[#080808] font-bold shadow-md shadow-[#c9993a]/20"
                      : "border border-[#2c2820] bg-[#161410] text-[#b8b2aa] hover:border-[#c9993a]/40 hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[#080808]" : item.dotColor}`} />
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      isSelected
                        ? "bg-[#080808]/20 text-[#080808]"
                        : "bg-[#111010] text-[#b8b2aa] group-hover:text-white"
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
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c9993a]"
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
              className="h-10 w-full rounded-xl border border-[#2c2820] bg-[#161410] pl-10 pr-9 text-xs text-[#f4efe8] placeholder-[#b8b2aa]/60 outline-none transition focus:border-[#c9993a] focus:ring-1 focus:ring-[#c9993a]/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b2aa] hover:text-white"
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
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-[#222018] bg-[#111010]/50 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9993a]/30 bg-[#c9993a]/10 text-[#e8be6a]">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading orders queue...</p>
            <p className="mt-1 text-xs text-[#b8b2aa]">Connecting to Sri Murugan Cinema order stream</p>
          </div>
        ) : visibleOrders.length ? (
          <div className="grid gap-4">
            {visibleOrders.map((order) => {
              const isPending = order.status === "pending";
              const isPreparing = order.status === "preparing";
              const isCompleted = order.status === "completed";
              const timeline = getOrderTimeline(order);

              return (
                <article
                  key={order.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-[#111010] to-[#0c0a08] p-5 shadow-xl transition duration-200 hover:border-[#c9993a]/50 ${
                    isPending
                      ? "border-[#c9993a]/60 ring-1 ring-[#c9993a]/30"
                      : isPreparing
                      ? "border-sky-500/50"
                      : isCompleted
                      ? "border-emerald-500/30"
                      : "border-[#222018] opacity-75"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: Seat info & Metadata */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Order ID */}
                        <span className="font-mono text-sm font-bold text-[#e8be6a]">
                          #{order.id}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-[#c9993a]/15 text-[#e8be6a] border border-[#c9993a]/40"
                              : isPreparing
                              ? "bg-sky-500/15 text-sky-300 border border-sky-500/40"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPending
                                ? "bg-[#e8be6a] animate-pulse"
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
                        <span className="text-xs text-[#b8b2aa] font-medium">
                          • {formatElapsed(order.createdAt)} ({formatOrderTime(order.createdAt)})
                        </span>
                      </div>

                      {/* Primary Destination: Seat Highlight */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/15 px-3 py-1.5 shadow-sm">
                          <svg
                            className="h-4 w-4 shrink-0 text-[#e8be6a]"
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
                          <span className="text-sm font-bold text-[#e8be6a]">
                            {order.seat}
                          </span>
                        </div>

                        <span className="text-xs text-[#b8b2aa]">
                          Guest:{" "}
                          <strong className="text-white">
                            {order.customerName?.trim() || "Guest Customer"}
                          </strong>
                        </span>
                      </div>

                      {/* Staff Handling Status Badge */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {order.acceptedBy ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-200">
                            <svg className="h-3.5 w-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>
                              Accepted by: <strong className="font-bold text-white">{order.acceptedBy}</strong>
                            </span>
                            {order.acceptedAt && (
                              <span className="text-sky-300/80">• {formatOrderTime(order.acceptedAt)}</span>
                            )}
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9993a]/30 bg-[#c9993a]/10 px-2.5 py-1 text-xs text-[#e8be6a]">
                            <svg className="h-3.5 w-3.5 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Awaiting staff acceptance</span>
                          </span>
                        ) : null}

                        {order.completedBy && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                            <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>
                              Delivered by: <strong className="font-bold text-white">{order.completedBy}</strong>
                            </span>
                            {order.completedAt && (
                              <span className="text-emerald-300/80">• {formatOrderTime(order.completedAt)}</span>
                            )}
                          </span>
                        )}

                        {order.cancelledBy && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200">
                            <svg className="h-3.5 w-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>
                              Cancelled by: <strong className="font-bold text-white">{order.cancelledBy}</strong>
                            </span>
                            {order.cancelledAt && (
                              <span className="text-rose-300/80">• {formatOrderTime(order.cancelledAt)}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment & Action Buttons */}
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:items-end">
                      {/* Price Pill */}
                      <div className="rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 py-1.5 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#b8b2aa]">Total Paid</p>
                        <p className="text-base font-extrabold text-[#e8be6a]">
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
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-4 py-2.5 text-xs font-bold text-[#080808] shadow-md shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
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
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{savingId === order.id ? "Saving..." : "Mark Delivered"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPrintOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-2 text-xs font-semibold text-[#f4efe8] hover:border-[#c9993a] hover:text-[#e8be6a] transition"
                        >
                          <svg className="h-3.5 w-3.5 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                          </svg>
                          <span>Print KOT</span>
                        </button>

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
                  <div className="mt-4 border-t border-[#222018] pt-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#b8b2aa]">
                      Food &amp; Beverage Items ({order.items?.reduce((s, i) => s + i.quantity, 0) || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(order.items) &&
                        order.items.map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5 text-xs"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#c9993a]/20 font-bold text-[#e8be6a]">
                              {item.quantity}×
                            </span>
                            <span className="font-semibold text-white">
                              {item.name}
                            </span>
                            {item.variantName && (
                              <span className="rounded-md border border-[#2c2820] bg-[#111010] px-1.5 py-0.5 text-[10px] text-[#b8b2aa]">
                                {item.variantName}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Footer metadata & Action Logs toggle */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#222018] pt-3 text-[11px] text-[#b8b2aa]">
                    <div className="flex flex-wrap items-center gap-3">
                      {order.razorpayPaymentId && (
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          <span>Payment ID:</span>
                          <code className="rounded bg-[#080808] px-1.5 py-0.5 font-mono text-[10px] text-[#e8be6a]">
                            {order.razorpayPaymentId}
                          </code>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleLogs(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5 text-xs font-semibold text-[#f4efe8] transition hover:border-[#c9993a]/60 hover:bg-[#222018]"
                    >
                      <svg className="h-3.5 w-3.5 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>
                        {expandedLogs[order.id]
                          ? "Hide Order Activity Logs"
                          : `Order Logs & Staff Timeline (${timeline.length})`}
                      </span>
                      <svg
                        className={`h-3 w-3 text-[#b8b2aa] transition-transform ${
                          expandedLogs[order.id] ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  {/* Expandable Order Logs Timeline */}
                  {expandedLogs[order.id] && (
                    <div className="mt-3 rounded-2xl border border-[#2c2820] bg-[#0c0a08] p-4 sm:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#222018] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#e8be6a]">
                            Order Audit Log &amp; Staff Handling History
                          </span>
                          <span className="rounded-full bg-[#161410] px-2 py-0.5 text-[10px] font-mono text-[#b8b2aa] border border-[#2c2820]">
                            #{order.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#b8b2aa]">
                          {timeline.length} {timeline.length === 1 ? "event recorded" : "events recorded"}
                        </span>
                      </div>

                      <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-[#2c2820]">
                        {timeline.map((event, idx) => {
                          const isPlaced = event.action === "placed";
                          const isAccepted = event.action === "accepted";
                          const isCompletedEvent = event.action === "completed";
                          const isCancelledEvent = event.action === "cancelled";
                          const isSeatUpdated = event.action === "seat_updated";

                          return (
                            <div key={idx} className="relative text-xs">
                              {/* Timeline indicator node */}
                              <div
                                className={`absolute -left-6 top-0.5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border ${
                                  isAccepted
                                    ? "border-sky-400 bg-sky-950 text-sky-300"
                                    : isCompletedEvent
                                    ? "border-emerald-400 bg-emerald-950 text-emerald-300"
                                    : isCancelledEvent
                                    ? "border-rose-400 bg-rose-950 text-rose-300"
                                    : isSeatUpdated
                                    ? "border-amber-400 bg-amber-950 text-amber-300"
                                    : "border-[#e8be6a] bg-[#161410] text-[#e8be6a]"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              </div>

                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`font-bold ${
                                      isAccepted
                                        ? "text-sky-300"
                                        : isCompletedEvent
                                        ? "text-emerald-300"
                                        : isCancelledEvent
                                        ? "text-rose-300"
                                        : isSeatUpdated
                                        ? "text-amber-300"
                                        : "text-[#e8be6a]"
                                    }`}
                                  >
                                    {isPlaced
                                      ? "Order Placed & Confirmed"
                                      : isAccepted
                                      ? "Accepted & Prep Started"
                                      : isCompletedEvent
                                      ? "Delivered & Fulfilled"
                                      : isCancelledEvent
                                      ? "Order Cancelled"
                                      : "Seat Location Updated"}
                                  </span>

                                  {/* Prominent Staff Attribution Pill */}
                                  {(isAccepted || isCompletedEvent || isCancelledEvent) && (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-xs text-sky-200">
                                      <svg className="h-3 w-3 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                      </svg>
                                      <span>
                                        Staff Member: <strong className="font-bold text-white text-xs">{event.actorName || (isAccepted ? order.acceptedBy : isCompletedEvent ? order.completedBy : order.cancelledBy) || "Staff"}</strong>
                                      </span>
                                      <span className="text-[10px] text-sky-300/70 uppercase">({event.actorType})</span>
                                    </span>
                                  )}

                                  {isPlaced && (
                                    <span className="rounded bg-[#161410] px-2 py-0.5 text-[11px] font-semibold text-[#b8b2aa] border border-[#2c2820]">
                                      Customer: <strong className="text-white">{event.actorName || order.customerName || "Customer"}</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-mono text-[#b8b2aa]">
                                  {formatOrderTime(event.timestamp)} ({formatElapsed(event.timestamp)})
                                </div>
                              </div>

                              {event.note && (
                                <p className="mt-1.5 rounded-xl border border-[#222018] bg-[#161410]/70 p-2.5 text-[11px] text-[#f4efe8]">
                                  {event.note}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#222018] bg-[#111010]/30 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2c2820] bg-[#161410] text-[#c9993a]">
              <svg className="h-8 w-8 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              {search ? "No matching orders found" : "No orders in this view"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#b8b2aa]">
              {search
                ? `No orders matched "${search}". Try searching by order number, guest name, or screen.`
                : "When customers order from their seats via the QR menu, confirmed orders will display here automatically."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5 text-xs font-semibold text-[#f4efe8] hover:border-[#c9993a]/50"
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
              className="inline-flex items-center gap-2 rounded-xl border border-[#2c2820] bg-[#111010] px-6 py-2.5 text-xs font-semibold text-[#f4efe8] shadow-sm transition hover:border-[#c9993a]/50 hover:bg-[#161410] disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  </svg>
                  <span>Loading older orders...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Load More Orders</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Kitchen Order Ticket (KOT) Modal */}
      {printOrder && (
        <KitchenOrderTicketModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </main>
  );
}
