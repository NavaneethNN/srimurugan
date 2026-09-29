"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Order = {
  id: number;
  customerName: string | null;
  seat: string;
  items: { name: string; quantity: number }[];
  status: string;
  createdAt: string;
};
const statuses = ["pending", "preparing", "completed", "cancelled"];

export default function FoodOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/food-orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      setOrders(data.orders);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    const interval = window.setInterval(loadOrders, 15000);
    return () => window.clearInterval(interval);
  }, [loadOrders]);

  const updateStatus = async (id: number, status: string) => {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/food-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update order.");
      setOrders((current) => current.map((order) => order.id === id ? data.order : order));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update order.");
    } finally {
      setSavingId(null);
    }
  };

  return <main className="min-h-screen bg-background px-4 py-8 text-white"><div className="mx-auto max-w-5xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Sri Murugan Cinema</p><h1 className="mt-1 text-3xl font-bold">Food orders</h1><p className="mt-2 text-sm text-muted">New orders appear automatically every 15 seconds.</p></div><Link href="/admin" className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold">← Admin panel</Link></div>{error && <p role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted">{orders.filter((order) => order.status === "pending").length} pending · {orders.length} recent</p><button type="button" onClick={loadOrders} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:border-gold">Refresh orders</button></div>{loading ? <p className="text-muted">Loading orders…</p> : orders.length ? <div className="grid gap-4 md:grid-cols-2">{orders.map((order) => <article key={order.id} className="rounded-xl border border-white/15 bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Order #{order.id}</p><h2 className="mt-1 text-lg font-bold">{order.seat}</h2><p className="text-xs text-muted">{order.customerName || "Guest"} · {new Date(order.createdAt).toLocaleString("en-IN")}</p></div><span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold capitalize text-gold">{order.status}</span></div><ul className="my-5 space-y-2 border-y border-white/10 py-4 text-sm">{Array.isArray(order.items) && order.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-3"><span>{item.name}</span><span className="font-bold text-gold">× {item.quantity}</span></li>)}</ul><label className="block text-xs font-semibold text-muted">Order status<select value={order.status} disabled={savingId === order.id} onChange={(event) => updateStatus(order.id, event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-background p-3 text-sm text-white outline-none focus:border-gold">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label></article>)}</div> : <p className="rounded-xl border border-dashed border-gold/25 p-10 text-center text-sm text-muted">No food orders yet.</p>}</div></main>;
}
