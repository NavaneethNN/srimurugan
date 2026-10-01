import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description: "Cancellation policy for food and beverage orders at Sri Murugan Cinema.",
  alternates: { canonical: "/cancellation-policy" },
};

export default function CancellationPolicyPage() {
  return (
    <PolicyPage
      title="Cancellation Policy"
      introduction="This policy explains when a food or beverage order may be cancelled."
      sections={[
        {
          title: "Cancellation after ordering",
          content: <p>Once an order is placed, cancellation does not qualify for a refund or exchange, except where required by applicable law.</p>,
        },
        {
          title: "Incorrect seat number",
          content: <p>Orders with a wrong screen or seat number may be cancelled by the theatre. No refund will be made for a cancellation caused by an incorrect seat number, except where required by applicable law. Check your details carefully before submitting your order.</p>,
        },
        {
          title: "Service time",
          content: <p>Please allow 20–25 minutes for service after placing your order.</p>,
        },
      ]}
    />
  );
}
