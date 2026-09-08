import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { CartRoot } from "@/components/Cart";

export const metadata: Metadata = {
  title: "Red Umbrella Printing",
  description: "Full-service printing in Jamaica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <CartRoot />
        </CartProvider>
      </body>
    </html>
  );
}
