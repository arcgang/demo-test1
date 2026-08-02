"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { itemCount } = useCart();

  return (
    <header>
      <Link href="/">Vodacom</Link>
      <nav>
        <Link href="/catalog">Devices</Link>
        <Link href="/plans">Plans</Link>
        <Link href="/accessories">Accessories</Link>
        <Link href="/support">Support</Link>
      </nav>
      <button type="button">Account</button>
      <button type="button" aria-label={`Cart (${itemCount} items)`}>
        Cart {itemCount}
      </button>
    </header>
  );
}
