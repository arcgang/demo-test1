"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.productId === item.productId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + item.quantity,
        };
        return updated;
      }
      return [...prev, item];
    });
  }

  return (
    <CartContext.Provider value={{ items, addItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  return useContext(CartContext);
}
