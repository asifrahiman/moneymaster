import type { Metadata, Viewport } from "next";
import { themeScript } from "@/components/theme";
import { Toaster } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MoneyMaster", template: "%s · MoneyMaster" },
  description: "Track spending, income and savings.",
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
      </body>
    </html>
  );
}
