import type { Metadata } from "next";
import Header from "@/components/Header";
import OrderFood from "@/components/OrderFood";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Order Food",
  description: "Order snacks, beverages and desserts for your movie at Sri Murugan Cinema.",
  alternates: { canonical: "/order-food" },
};

export const revalidate = 60;

export default function OrderFoodPage() {
  return (
    <div className="site-light flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-[68px]">
        <OrderFood />
      </main>
      <Footer />
    </div>
  );
}
