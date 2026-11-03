import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { CartProvider } from "@/components/Cart";
import { SHOP } from "@/lib/config";
import "./globals.css";

const sans = Archivo({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SHOP.name} — ${SHOP.tagline}`, template: `%s — ${SHOP.name}` },
  description: "Clothing, shoes, tech, beauty and home, delivered anywhere in Lebanon. Cash on delivery.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f3d2c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
