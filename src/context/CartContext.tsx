"use client";

import React, { createContext, useContext, useState } from "react";

interface CartContextValue {
  itemCount: number;
  setItemCount: (count: number) => void;
}

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  setItemCount: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  return (
    <CartContext.Provider value={{ itemCount, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  return useContext(CartContext);
}
