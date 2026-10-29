import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://srimurugancinema.in",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://srimurugancinema.in/order-food",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...["terms-and-conditions", "cancellation-policy", "refund-policy"].map((path) => ({
      url: `https://srimurugancinema.in/${path}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
