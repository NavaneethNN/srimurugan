"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/foodMenu";
import type { OrderStatusLog } from "@/lib/schema";
import KitchenOrderTicketModal, { KotOrder } from "@/components/KitchenOrderTicket";

type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; variantName?: string; quantity: number }[];
  status: string;
  amountPaise: number | null;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  completedBy?: string | null;
  completedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  statusLogs?: OrderStatusLog[] | null;
  createdAt: string;
};

type View = "all" | "pending" | "preparing";

function formatOrderTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
  const [printOrder, setPrintOrder] = useState<KotOrder | null>(null);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cafe_kot_printed_order_ids");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setPrintedOrderIds(new Set(arr));
        }
      }
    } catch {
      /* optional */
    }
  }, []);

  const handleTogglePrinted = useCallback((orderId: number, printed: boolean) => {
    setPrintedOrderIds((prev) => {
      const next = new Set(prev);
      if (printed) next.add(orderId);
      else next.delete(orderId);
      try {
        localStorage.setItem("cafe_kot_printed_order_ids", JSON.stringify(Array.from(next)));
      } catch {
        /* optional */
      }
      return next;
    });
  }, []);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);
  const knownIds = useRef(new Set<number>());
  const noticeQueue = useRef<number[]>([]);
  const activeNoticeId = useRef<number | null>(null);

  const showNextNotice = useCallback((active: Order[]) => {
    if (activeNoticeId.current !== null) return;
    noticeQueue.current = noticeQueue.current.filter((id) =>
      active.some((order) => order.id === id && order.status === "pending")
    );
    const next = noticeQueue.current.shift();
    if (next === undefined) return;
    activeNoticeId.current = next;
    setNoticeId(next);
  }, []);

  const loadOrders = useCallback(
    async (cursor?: number) => {
      const id = ++requestId.current;
      try {
        const url = cursor
          ? `/api/cafe/food-orders?status=active&limit=100&cursor=${cursor}`
          : "/api/cafe/food-orders?status=active&limit=100";
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        if (response.status === 401) {
          router.replace("/cafe/login");
          return;
        }
        if (!response.ok) throw new Error(data.error || "Unable to load orders.");
        if (id !== requestId.current) return;
        const incoming = (data.orders as Order[])
          .slice()
          .sort(
            (a, b) =>
              Number(b.status === "pending") - Number(a.status === "pending") || a.id - b.id
          );
        const active = cursor ? [...incoming] : incoming;
        if (hasLoaded.current) {
          for (const order of incoming) {
            if (order.status === "pending" && !knownIds.current.has(order.id)) {
              noticeQueue.current.push(order.id);
            }
          }
        }
        for (const order of incoming) knownIds.current.add(order.id);
        hasLoaded.current = true;
        if (
          activeNoticeId.current !== null &&
          !active.some((order) => order.id === activeNoticeId.current && order.status === "pending")
        ) {
          activeNoticeId.current = null;
          setNoticeId(null);
        }
        if (cursor) {
          setOrders((prev) => {
            const merged = [...prev, ...incoming].sort(
              (a, b) =>
                Number(b.status === "pending") - Number(a.status === "pending") || a.id - b.id
            );
            return merged.filter(
              (order, index, arr) => arr.findIndex((o) => o.id === order.id) === index
            );
          });
          showNextNotice(incoming);
        } else {
          showNextNotice(active);
          setOrders(active);
        }
        setCounts(data.counts || {});
        setHasMore(data.nextCursor !== null);
        setUpdatedAt(new Date());
        setError("");
      } catch (cause) {
        if (id === requestId.current) {
          setError(cause instanceof Error ? cause.message : "Unable to load orders.");
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [router, showNextNotice]
  );

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/cafe/session", { cache: "no-store" });
        if (!response.ok) {
          router.replace("/cafe/login");
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch {
        router.replace("/cafe/login");
      }
    }
    const initial = window.setTimeout(() => {
      void checkSession();
      void loadOrders();
    }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadOrders();
    }, 3_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadOrders();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      requestId.current += 1;
    };
  }, [loadOrders, router]);

  const selectedOrder = orders.find((order) => order.id === selectedId) || null;
  const noticeOrder = orders.find((order) => order.id === noticeId) || null;
  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter(
      (order) =>
        (view === "all" || order.status === view) &&
        (!term ||
          String(order.id).includes(term) ||
          order.seat.toLowerCase().includes(term) ||
          order.customerName?.toLowerCase().includes(term) ||
          order.acceptedBy?.toLowerCase().includes(term))
    );
  }, [orders, view, search]);

  function dismissNotice() {
    activeNoticeId.current = null;
    setNoticeId(null);
    showNextNotice(orders);
  }

  async function updateStatus(order: Order, next: "preparing" | "completed" | "cancelled") {
    if (
      next === "cancelled" &&
      !window.confirm(`Cancel order #${order.id}? The customer will see this status.`)
    ) {
      return;
    }
    setSavingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/cafe/food-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
      if (next === "preparing") {
        setPrintOrder(data.order);
        handleTogglePrinted(order.id, true);
      }
      if (next === "completed" || next === "cancelled") setSelectedId(null);
      if (activeNoticeId.current === order.id) dismissNotice();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    await fetch("/api/cafe/auth", { method: "DELETE" });
    router.replace("/cafe/login");
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#080808] text-[#f4efe8]">
      {/* Header */}
      <header className="border-b border-[#222018] bg-[#111010]/90 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-[#c9993a]">
                Sri Murugan Cinema
              </span>
              <span className="font-dancing text-sm text-[#e8be6a]">Concessions POS</span>
            </div>
            <h1 className="text-lg font-bold text-[#f4efe8]">Cafe Terminal</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-xl border border-[#2c2820] bg-[#161410] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-[#f4efe8]">{user?.name || "Staff"}</span>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="min-h-9 rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 text-xs font-semibold text-[#b8b2aa] hover:border-rose-500/50 hover:bg-rose-950/20 hover:text-rose-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
        {/* Status Counters & Refresh Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/10 px-3 py-2 text-xs font-bold text-[#e8be6a]">
              <span className="h-2 w-2 rounded-full bg-[#e8be6a] animate-pulse" />
              <strong className="text-sm tabular-nums text-white">{counts.pending || 0}</strong> New Orders
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <strong className="text-sm tabular-nums text-white">{counts.preparing || 0}</strong> Preparing
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#b8b2aa]">
              {updatedAt ? `Synced ${formatOrderTime(updatedAt.toISOString())}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="min-h-9 rounded-xl border border-[#2c2820] bg-[#111010] px-3.5 text-xs font-semibold text-[#f4efe8] hover:border-[#c9993a]/50 hover:bg-[#161410]"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}

        {hasMore && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#c9993a]/40 bg-[#c9993a]/10 px-4 py-3 text-xs text-[#e8be6a]">
            <span>More than 100 active orders — showing oldest first.</span>
            <button
              type="button"
              onClick={() => void loadOrders(orders[orders.length - 1]?.id)}
              className="min-h-8 rounded-lg border border-[#c9993a] bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-3 text-xs font-bold text-[#080808]"
            >
              Load more
            </button>
          </div>
        )}

        {/* 2-Column POS Layout */}
        <div className="grid min-h-[68vh] gap-4 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          {/* Left Panel: Active Queue */}
          <section
            aria-label="Active orders"
            className="flex flex-col overflow-hidden rounded-2xl border border-[#222018] bg-[#111010]"
          >
            <div className="border-b border-[#222018] p-3.5">
              <div className="flex gap-1.5">
                {(["all", "pending", "preparing"] as View[]).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setView(item)}
                    aria-pressed={view === item}
                    className={`min-h-9 flex-1 rounded-xl px-2 text-xs font-bold uppercase tracking-wider transition ${
                      view === item
                        ? "bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] text-[#080808] shadow-sm"
                        : "border border-[#2c2820] bg-[#161410] text-[#b8b2aa] hover:text-white"
                    }`}
                  >
                    {item === "pending" ? "New" : item}
                  </button>
                ))}
              </div>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order #, seat, or staff..."
                className="mt-3 h-10 w-full rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 text-xs text-[#f4efe8] placeholder-[#7d7871] outline-none transition focus:border-[#c9993a]"
              />
            </div>

            {loading && orders.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#b8b2aa]">Loading orders…</p>
            ) : visibleOrders.length ? (
              <div className="max-h-[70vh] divide-y divide-[#222018] overflow-y-auto">
                {visibleOrders.map((order) => {
                  const isSelected = selectedId === order.id;
                  const isPending = order.status === "pending";

                  return (
                    <button
                      type="button"
                      key={order.id}
                      onClick={() => setSelectedId(order.id)}
                      aria-pressed={isSelected}
                      className={`w-full p-4 text-left transition hover:bg-[#161410] ${
                        isSelected ? "bg-[#161410] ring-1 ring-inset ring-[#c9993a]/40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#f4efe8]">
                          #{order.id} · <span className="text-[#e8be6a]">{order.seat}</span>
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? "border border-[#c9993a]/40 bg-[#c9993a]/15 text-[#e8be6a]"
                              : "border border-sky-500/40 bg-sky-500/15 text-sky-300"
                          }`}
                        >
                          {isPending ? "New" : "Preparing"}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-xs text-[#b8b2aa]">
                        <span>{order.customerName || "Guest"}</span>
                        <span className="font-bold text-[#e8be6a]">{formatPrice(order.amountPaise)}</span>
                      </div>

                      {/* Staff Handling Tag & KOT Print Status */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-[#1e1c16]">
                        {order.acceptedBy ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-sky-300">
                            <svg className="h-3 w-3 shrink-0 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>Prep: <strong className="text-white">{order.acceptedBy}</strong></span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7d7871]">Awaiting prep</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {printedOrderIds.has(order.id) ? (
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                              <span>KOT Printed</span>
                            </span>
                          ) : (
                            order.status === "preparing" && (
                              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                <span>KOT Pending</span>
                              </span>
                            )
                          )}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintOrder(order);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                setPrintOrder(order);
                              }
                            }}
                            title="Print Kitchen Order Ticket"
                            className="inline-flex items-center justify-center rounded-lg border border-[#2c2820] bg-[#161410] p-1.5 text-[#b8b2aa] hover:border-[#c9993a] hover:text-[#e8be6a] transition cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="p-8 text-center text-xs text-[#b8b2aa]">No orders in this view.</p>
            )}
          </section>

          {/* Right Panel: Selected Order Details */}
          <section
            aria-label="Selected order"
            className="flex flex-col justify-between rounded-2xl border border-[#222018] bg-[#111010] p-5 sm:p-6"
          >
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Header details */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#222018] pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#e8be6a]">
                        Order #{selectedOrder.id}
                      </span>
                      <span className="text-xs text-[#b8b2aa]">
                        • {formatOrderTime(selectedOrder.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-[#f4efe8]">
                      {selectedOrder.seat}
                    </h2>
                    <p className="mt-1 text-xs text-[#b8b2aa]">
                      Guest Customer:{" "}
                      <strong className="text-white">
                        {selectedOrder.customerName || "Guest"}
                      </strong>
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      selectedOrder.status === "pending"
                        ? "border border-[#c9993a]/40 bg-[#c9993a]/15 text-[#e8be6a]"
                        : selectedOrder.status === "preparing"
                        ? "border border-sky-500/40 bg-sky-500/15 text-sky-300"
                        : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Staff Handling Status Banner */}
                <div className="rounded-xl border border-[#2c2820] bg-[#161410] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#b8b2aa]">
                    Staff Handling Status
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {selectedOrder.acceptedBy ? (
                      <div className="flex items-center gap-1.5 text-sky-300">
                        <svg className="h-3.5 w-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>
                          Accepted by <strong className="text-white">{selectedOrder.acceptedBy}</strong>
                          {selectedOrder.acceptedAt && ` at ${formatOrderTime(selectedOrder.acceptedAt)}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#e8be6a]">
                        <svg className="h-3.5 w-3.5 text-[#c9993a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Awaiting staff acceptance</span>
                      </div>
                    )}

                    {selectedOrder.completedBy && (
                      <div className="flex items-center gap-1.5 text-emerald-300 border-l border-[#2c2820] pl-2">
                        <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>
                          Delivered by <strong className="text-white">{selectedOrder.completedBy}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items list */}
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#b8b2aa]">
                    Items in this Order ({selectedOrder.items.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                  <div className="divide-y divide-[#222018] rounded-xl border border-[#222018] bg-[#161410]">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between p-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#c9993a]/20 font-bold text-[#e8be6a]">
                            {item.quantity}×
                          </span>
                          <span className="font-semibold text-white">{item.name}</span>
                          {item.variantName && (
                            <span className="rounded-md border border-[#2c2820] bg-[#111010] px-1.5 py-0.5 text-[10px] text-[#b8b2aa]">
                              {item.variantName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl border border-[#2c2820] bg-[#161410] p-3.5">
                  <span className="text-xs text-[#b8b2aa]">Total Paid (Online)</span>
                  <strong className="text-lg font-bold text-[#e8be6a]">
                    {formatPrice(selectedOrder.amountPaise)}
                  </strong>
                </div>

                {/* Activity Log / Timeline */}
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#b8b2aa]">
                    Order Activity Log
                  </h3>
                  <div className="space-y-2 rounded-xl border border-[#222018] bg-[#0c0a08] p-3 text-xs">
                    {getOrderTimeline(selectedOrder).map((log, idx) => (
                      <div key={idx} className="flex items-baseline justify-between gap-2 border-b border-[#161410] pb-2 last:border-0 last:pb-0">
                        <div>
                          <span className="font-bold text-[#f4efe8]">{log.note || log.action}</span>
                          <span className="ml-2 text-[10px] text-[#b8b2aa]">({log.actorType}: {log.actorName})</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#b8b2aa] shrink-0">
                          {formatOrderTime(log.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5 border-t border-[#222018] pt-4">
                  {selectedOrder.status === "pending" && (
                    <button
                      type="button"
                      disabled={savingId === selectedOrder.id}
                      onClick={() => void updateStatus(selectedOrder, "preparing")}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-5 text-xs font-black uppercase tracking-wider text-[#080808] shadow-md shadow-[#c9993a]/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>
                        {savingId === selectedOrder.id
                          ? "Accepting…"
                          : `Accept as ${user?.name || "Staff"}`}
                      </span>
                    </button>
                  )}

                  {selectedOrder.status === "preparing" && (
                    <button
                      type="button"
                      disabled={savingId === selectedOrder.id}
                      onClick={() => void updateStatus(selectedOrder, "completed")}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black uppercase tracking-wider text-black shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        {savingId === selectedOrder.id
                          ? "Saving…"
                          : `Mark Delivered as ${user?.name || "Staff"}`}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPrintOrder(selectedOrder)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#2c2820] bg-[#161410] px-3.5 text-xs font-bold text-[#f4efe8] hover:border-[#c9993a] hover:text-[#e8be6a] transition"
                  >
                    <svg className="h-4 w-4 text-[#e8be6a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>Print KOT</span>
                    {printedOrderIds.has(selectedOrder.id) && (
                      <span className="rounded bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-300">Printed</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={savingId === selectedOrder.id}
                    onClick={() => void updateStatus(selectedOrder, "cancelled")}
                    className="min-h-11 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-60 flex-col items-center justify-center text-center text-xs text-[#b8b2aa]">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c2820] bg-[#161410] text-[#c9993a]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <p>Select an order from the queue on the left to inspect its details and take action.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Floating Notice for new incoming orders */}
      {noticeOrder && (
        <aside
          role="status"
          className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),360px)] rounded-2xl border border-[#c9993a] bg-[#111010] p-4 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#e8be6a]">
                New Cinema Seat Order
              </p>
              <p className="mt-1 text-base font-bold text-white">
                #{noticeOrder.id} · {noticeOrder.seat}
              </p>
              <p className="mt-1 text-xs text-[#b8b2aa]">
                {noticeOrder.customerName || "Guest"} · {formatPrice(noticeOrder.amountPaise)}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Dismiss new order notice"
              className="rounded p-1 text-lg text-[#b8b2aa] hover:text-white"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(noticeOrder.id);
              void updateStatus(noticeOrder, "preparing");
            }}
            disabled={savingId === noticeOrder.id}
            className="mt-4 min-h-10 w-full rounded-xl bg-gradient-to-r from-[#c9993a] via-[#e8be6a] to-[#c9993a] px-4 text-xs font-black uppercase tracking-wider text-[#080808] disabled:opacity-50"
          >
            {savingId === noticeOrder.id ? "Accepting…" : `Accept as ${user?.name || "Staff"}`}
          </button>
        </aside>
      )}
      {/* Kitchen Order Ticket (KOT) Print Modal */}
      {printOrder && (
        <KitchenOrderTicketModal
          order={printOrder}
          currentStaffName={user?.name}
          isPrinted={printedOrderIds.has(printOrder.id)}
          onTogglePrinted={handleTogglePrinted}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </main>
  );
}
