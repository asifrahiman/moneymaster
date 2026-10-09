import type { Metadata, Viewport } from "next";
import { PwaInit } from "@/components/pwa-init";
import { themeScript } from "@/components/theme";
import { Toaster } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MoneyMaster", template: "%s · MoneyMaster" },
  description: "Track spending, income and savings.",
  applicationName: "MoneyMaster",
  // iOS "Add to Home Screen" (Android uses the manifest in app/manifest.ts).
  appleWebApp: { capable: true, title: "MoneyMaster", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster />
        <PwaInit />
      </body>
    </html>
  );
}
