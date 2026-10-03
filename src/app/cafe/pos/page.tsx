"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const STATUS_COLORS = {
  pending: "bg-amber-500",
  preparing: "bg-blue-500",
  completed: "bg-green-500",
};

const STATUS_LABELS = {
  pending: "NEW",
  preparing: "PREP",
  completed: "DONE",
};

export default function CafePOSPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  const requestId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderIdsRef = useRef<Set<number>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fast polling for real-time updates (every 2 seconds)
  const loadOrders = useCallback(async (isInitialLoad = false) => {
    const currentRequest = ++requestId.current;
    try {
      const response = await fetch("/api/cafe/food-orders?status=all&limit=50", {
        cache: "no-store" 
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Failed to load orders");
      if (currentRequest !== requestId.current) return;
      
      const activeOrders = data.orders.filter(
        (o: Order) => o.status !== "completed" && o.status !== "cancelled"
      );
      
      // Detect new orders by comparing IDs
      if (!isInitialLoad && prevOrderIdsRef.current.size > 0) {
        const newOrders = activeOrders.filter(
          (order: Order) => order.status === "pending" && !prevOrderIdsRef.current.has(order.id)
        );
        
        // Show popup for the first new order
        if (newOrders.length > 0) {
          setNewOrderPopup(newOrders[0]);
          audioRef.current?.play().catch(() => {});
        }
      }
      
      // Update previous order IDs
      prevOrderIdsRef.current = new Set(activeOrders.map((o: Order) => o.id));
      
      setOrders(activeOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Load user from cookie
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/cafe/session");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push("/cafe/login");
        }
      } catch {
        router.push("/cafe/login");
      }
    };
    
    void checkAuth();
    void loadOrders(true); // Initial load
    
    // Fast polling every 2 seconds for real-time updates
    pollingIntervalRef.current = setInterval(() => void loadOrders(), 2000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      requestId.current += 1;
    };
  }, [loadOrders, router]);

  const acceptNewOrder = async (order: Order) => {
    setNewOrderPopup(null);
    setSelectedOrder(order);
    // Automatically start preparing
    await updateOrderStatus(order.id, "preparing");
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setProcessing(orderId);
    try {
      const response = await fetch(`/api/cafe/food-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order");
      
      await loadOrders();
      
      if (selectedOrder?.id === orderId) {
        if (newStatus === "completed") {
          setSelectedOrder(null);
        } else {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order");
    } finally {
      setProcessing(null);
    }
  };

  const logout = async () => {
    await fetch("/api/cafe/auth", { method: "DELETE" });
    router.push("/cafe/login");
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;

  return (
    <main className="flex h-screen flex-col bg-gray-950 text-white">
      {/* Hidden audio element for notification */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BhGAg+ltryxnMmBSx+zPHaizsIGGS57OihUAwNUKXi8bllGwY7k9jyynksBSd3y/DdkEEKFWC16+umVRQLR6Df8r5sIAMxh9Hz04IzBSBtwu/jmVENEFWs5++wYRgIPpXa8sZzJgUsesvx2os7CRllu+zooVAMDlCl4vG5ZRsGOpPY8sp5LAUnd8vw3ZBBChVgtevqplUUC0eg3/K+bCADMYfR89OCMwUgbcLv45lRDRBVrOfvr2EYBz6V2vLGcyYFK3rL8dqLOwkZZbvs6KFQDANQpeLxuWUbBjqT2PLKeSwFJ3fL8N2QQQoVYLXr6qZVFAtHoN/yvmwgAzGH0fPTgjMFIG3C7+OZUQwQVqzn769hGAc+ldryx3MmBSt6y/HaizsJGWW77OihUAwDUKXi8bllGwY6k9jyynksBSd3y/DdkEEKFWC16+qmVRQLR6Df8r5sIAMxh9Hz04IzBSBtwu/jmVEMEFas5++vYRgHPpXa8sdzJgUrec===" type="audio/wav" />
      </audio>

      {/* New Order Popup Notification */}
      {newOrderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl animate-bounce rounded-2xl border-4 border-amber-500 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-8 shadow-2xl">
            <div className="text-center">
              <div className="mb-4 text-6xl">🔔</div>
              <h2 className="mb-2 text-4xl font-bold text-white">NEW ORDER!</h2>
              <p className="mb-6 text-2xl font-bold text-black">Order #{newOrderPopup.id}</p>
              
              <div className="mb-6 rounded-xl bg-black/30 p-6">
                <p className="mb-2 text-3xl font-bold text-white">{newOrderPopup.seat}</p>
                <p className="mb-4 text-lg text-white/90">
                  {newOrderPopup.customerName || "Guest"}
                </p>
                <div className="mb-4 space-y-2 text-left">
                  {newOrderPopup.items.slice(0, 5).map((item, idx) => (
                    <p key={idx} className="text-lg font-semibold text-white">
                      {item.quantity}x {item.name}
                      {item.variantName && ` (${item.variantName})`}
                    </p>
                  ))}
                  {newOrderPopup.items.length > 5 && (
                    <p className="text-white/70">
                      +{newOrderPopup.items.length - 5} more items
                    </p>
                  )}
                </div>
                <p className="text-3xl font-bold text-amber-300">
                  {formatPrice(newOrderPopup.amountPaise)}
                </p>
              </div>

              <button
                onClick={() => acceptNewOrder(newOrderPopup)}
                className="w-full rounded-xl bg-white px-12 py-6 text-3xl font-bold text-amber-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                ACCEPT & START PREPARING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-amber-400">Sri Murugan POS</h1>
          <div className="flex gap-2">
            <div className="rounded bg-amber-500/20 px-3 py-1 text-sm font-bold">
              <span className="text-amber-400">{pendingCount}</span> NEW
            </div>
            <div className="rounded bg-blue-500/20 px-3 py-1 text-sm font-bold">
              <span className="text-blue-400">{preparingCount}</span> PREP
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Operator: <strong className="text-white">{user?.name}</strong>
          </span>
          <button
            onClick={logout}
            className="rounded bg-red-600 px-4 py-2 text-sm font-bold uppercase transition-colors hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
            <p className="mt-4 text-gray-400">Loading orders...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Order List */}
          <div className="w-2/5 overflow-y-auto border-r border-gray-800 bg-gray-900">
            <div className="sticky top-0 bg-gray-800 px-4 py-3">
              <h2 className="text-lg font-bold uppercase tracking-wide">
                Active Orders ({orders.length})
              </h2>
            </div>
            
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg font-bold">No active orders</p>
                <p className="mt-2 text-sm">New orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full rounded p-4 text-left transition-all ${
                      selectedOrder?.id === order.id
                        ? "bg-amber-500 text-black"
                        : order.status === "pending"
                        ? "bg-amber-500/10 hover:bg-amber-500/20"
                        : "bg-gray-800 hover:bg-gray-750"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">#{order.id}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${
                              selectedOrder?.id === order.id
                                ? "bg-black/20 text-black"
                                : `${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]} text-white`
                            }`}
                          >
                            {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm font-bold ${
                          selectedOrder?.id === order.id ? "text-black" : "text-gray-400"
                        }`}>
                          {order.seat}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className={`mt-1 text-lg font-bold ${
                          selectedOrder?.id === order.id ? "text-black" : "text-amber-400"
                        }`}>
                          {formatPrice(order.amountPaise)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <p key={idx} className={`text-sm ${
                          selectedOrder?.id === order.id ? "text-black/80" : "text-gray-300"
                        }`}>
                          {item.quantity}x {item.name}
                          {item.variantName && ` (${item.variantName})`}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className={`text-xs ${
                          selectedOrder?.id === order.id ? "text-black/60" : "text-gray-500"
                        }`}>
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="flex-1 bg-gray-950 p-6">
            {selectedOrder ? (
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-amber-400">
                      Order #{selectedOrder.id}
                    </h2>
                    <p className="mt-2 text-xl font-bold">{selectedOrder.seat}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {selectedOrder.customerName || "Guest"} •{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg ${
                      STATUS_COLORS[selectedOrder.status as keyof typeof STATUS_COLORS]
                    } px-6 py-3 text-2xl font-bold uppercase text-white`}
                  >
                    {STATUS_LABELS[selectedOrder.status as keyof typeof STATUS_LABELS]}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6 flex-1 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-800">
                      <tr className="text-left">
                        <th className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-400">
                          Item
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide text-gray-400">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <p className="text-lg font-bold">{item.name}</p>
                            {item.variantName && (
                              <p className="text-sm text-gray-400">{item.variantName}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-2xl font-bold text-amber-400">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold uppercase tracking-wide text-gray-400">
                      Total Amount
                    </span>
                    <span className="text-4xl font-bold text-amber-400">
                      {formatPrice(selectedOrder.amountPaise)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.status === "pending" && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, "preparing")}
                      disabled={processing === selectedOrder.id}
                      className="col-span-2 rounded-lg bg-blue-500 px-8 py-6 text-xl font-bold uppercase transition-colors hover:bg-blue-600 disabled:opacity-50"
                    >
                      {processing === selectedOrder.id ? "Processing..." : "Start Preparing"}
                    </button>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, "completed")}
                      disabled={processing === selectedOrder.id}
                      className="col-span-2 rounded-lg bg-green-500 px-8 py-6 text-xl font-bold uppercase transition-colors hover:bg-green-600 disabled:opacity-50"
                    >
                      {processing === selectedOrder.id ? "Processing..." : "Mark Complete"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="col-span-2 rounded-lg border-2 border-gray-700 px-8 py-6 text-xl font-bold uppercase transition-colors hover:bg-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600">
                <div className="text-center">
                  <p className="text-2xl font-bold">Select an order to view details</p>
                  <p className="mt-2">Click on any order from the list on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
