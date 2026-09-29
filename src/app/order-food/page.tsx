import Header from "@/components/Header";
import OrderFood from "@/components/OrderFood";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Order Food",
  description: "Order snacks, beverages and desserts for your movie at Sri Murugan Cinema.",
};

export default function OrderFoodPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-[68px]">
        <OrderFood />
      </main>
      <Footer />
    </div>
  );
}