"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface MarketContextValue {
  liteMode: boolean;
  setLiteMode: (value: boolean) => void;
}

const MarketContext = createContext<MarketContextValue>({
  liteMode: false,
  setLiteMode: () => {},
});

export function MarketContextProvider({ children }: { children: ReactNode }) {
  const [liteMode, setLiteMode] = useState(false);
  return (
    <MarketContext.Provider value={{ liteMode, setLiteMode }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketContext(): MarketContextValue {
  return useContext(MarketContext);
}
