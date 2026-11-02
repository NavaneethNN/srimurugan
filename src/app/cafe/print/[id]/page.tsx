"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import KitchenOrderTicketModal, { KotOrder } from "@/components/KitchenOrderTicket";

export default function CafePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params?.id ? Number(params.id) : null;
  const autoPrint = searchParams?.get("autoprint") === "1";

  const [order, setOrder] = useState<KotOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffUser, setStaffUser] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/cafe/session", { cache: "no-store" });
        if (!sessionRes.ok) {
          router.replace("/cafe/login");
          return;
        }
        const sessionData = await sessionRes.json();
        setStaffUser(sessionData.user);

        if (!orderId || !Number.isSafeInteger(orderId)) {
          setError("Invalid order ID.");
          setLoading(false);
          return;
        }

        const orderRes = await fetch(`/api/cafe/food-orders/${orderId}`, { cache: "no-store" });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || "Order not found.");
        }
        setOrder(orderData.order);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load order.");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-[#f4efe8]">
        <p className="text-sm font-semibold text-[#b8b2aa]">Loading Kitchen Order Ticket…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] p-4 text-[#f4efe8]">
        <div className="w-full max-w-md rounded-2xl border border-[#2c2820] bg-[#111010] p-6 text-center">
          <p className="text-sm font-semibold text-rose-300">{error || "Order not found."}</p>
          <Link
            href="/cafe/pos"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#c9993a] px-4 text-xs font-bold text-black"
          >
            ← Return to Cafe POS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <KitchenOrderTicketModal
        order={order}
        currentStaffName={staffUser?.name}
        onClose={() => router.push("/cafe/pos")}
        autoLaunchPrint={autoPrint}
      />
    </div>
  );
}

