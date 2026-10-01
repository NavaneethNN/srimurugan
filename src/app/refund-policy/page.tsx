import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and exchange policy for food and beverage orders at Sri Murugan Cinema.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      introduction="Please review your items and seat details before placing an order."
      sections={[
        {
          title: "No refunds or exchanges",
          content: <p>Food and beverage orders are not eligible for a refund or exchange after they are placed, except where required by applicable law.</p>,
        },
        {
          title: "Wrong seat number",
          content: <p>If an incorrect screen or seat number is given, the theatre may cancel the order without a refund, except where required by applicable law.</p>,
        },
        {
          title: "Payment issues",
          content: <p>If you are charged online but your order is not confirmed, please speak to cinema staff at the theatre with your payment details so the transaction can be checked. Any refund due in this case will be returned to the original payment method in accordance with the payment provider’s processing timelines.</p>,
        },
      ]}
    />
  );
}
