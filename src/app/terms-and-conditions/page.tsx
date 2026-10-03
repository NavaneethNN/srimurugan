import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms for food and beverage orders at Sri Murugan Cinema.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      introduction="Please read these terms before placing a food or beverage order at Sri Murugan Cinema."
      sections={[
        {
          title: "Service time",
          content: <p>Please allow 20–25 minutes for your order to be prepared and served.</p>,
        },
        {
          title: "Payment",
          content: <p>Payment for food and beverage orders is online. Your order is sent to cinema staff only after the payment provider confirms that payment has been captured.</p>,
        },
        {
          title: "Screen and seat details",
          content: <p>Enter the correct screen and seat number when ordering. If you provide the wrong seat number, your order may be cancelled and no refund will be made.</p>,
        },
        {
          title: "Exchanges and refunds",
          content: <p>Orders cannot be exchanged or refunded, except where required by applicable law. Please review your order and seat details before submitting it.</p>,
        },
      ]}
    />
  );
}
