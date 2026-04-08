import type { MetadataRoute } from "next";

const BASE = "https://subscription-expenses-manager.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/dashboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/subscriptions`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/expenses`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/vault`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/notifications`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
  ];
}
