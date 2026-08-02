"use client";
import { useMarketContext } from "@/context/MarketContext";

export default function LiteModeSwitch() {
  const { liteMode, setLiteMode } = useMarketContext();
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <input
        type="checkbox"
        checked={liteMode}
        onChange={(e) => setLiteMode(e.target.checked)}
      />
      Lite Mode
    </label>
  );
}
