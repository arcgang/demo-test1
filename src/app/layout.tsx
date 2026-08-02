import type { ReactNode } from "react";
import { MarketContextProvider } from "@/context/MarketContext";
import { CartProvider } from "@/context/CartContext";
import LiteModeSwitch from "@/components/LiteModeSwitch";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MarketContextProvider>
          <CartProvider>
            <header>
              <LiteModeSwitch />
            </header>
            {children}
          </CartProvider>
        </MarketContextProvider>
      </body>
    </html>
  );
}
