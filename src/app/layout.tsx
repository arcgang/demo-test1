import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
