import type { MetadataRoute } from "next";

/** Web app manifest: lets Android (Chrome) install MoneyMaster as a full-screen app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MoneyMaster",
    short_name: "MoneyMaster",
    description: "Track spending, income and savings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f6f3",
    theme_color: "#f6f6f3",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Reports", url: "/reports", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Trends", url: "/trends", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
