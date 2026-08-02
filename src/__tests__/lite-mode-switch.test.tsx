/**
 * Acceptance tests: LiteModeSwitch control in app shell (FR-026)
 *
 * These tests MUST FAIL until the following are implemented:
 *   - @/context/MarketContext  (React context with liteMode + setLiteMode)
 *   - @/context/CartContext    (React context with cart items)
 *   - @/components/LiteModeSwitch  (toggle rendered in the app shell)
 *
 * Criteria:
 *   (a) toggling on  → marketContext.liteMode becomes true
 *   (b) toggling off → marketContext.liteMode becomes false
 *   (c) cart contents are unchanged after both toggle transitions (FR-026)
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MarketContextProvider, useMarketContext } from "@/context/MarketContext";
import { CartProvider, useCart } from "@/context/CartContext";
import LiteModeSwitch from "@/components/LiteModeSwitch";

// ── Spy components ────────────────────────────────────────────────────────────

/** Reads liteMode out of context and renders it for assertions. */
function LiteModeReader() {
  const { liteMode } = useMarketContext();
  return <output data-testid="lite-mode-value">{String(liteMode)}</output>;
}

/** Reads cart items out of context and renders a summary for assertions. */
function CartReader() {
  const { items } = useCart();
  return (
    <output data-testid="cart-items">
      {items.map((item) => item.productId).join(",")}
    </output>
  );
}

/** Minimal wrapper that nests both providers the same way the app shell will. */
function TestShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketContextProvider>
      <CartProvider>{children}</CartProvider>
    </MarketContextProvider>
  );
}

/** Helper: a component that adds a fixed item to the cart on mount. */
function CartSeeder() {
  const { addItem } = useCart();
  React.useEffect(() => {
    addItem({ productId: "iphone-15-pro", quantity: 1, price: 24999 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ── (a) toggling ON sets liteMode = true ─────────────────────────────────────

describe("LiteModeSwitch — toggle on", () => {
  it("sets liteMode to true in MarketContext when switched on", async () => {
    const user = userEvent.setup();

    render(
      <TestShell>
        <LiteModeSwitch />
        <LiteModeReader />
      </TestShell>
    );

    // Initial state: liteMode should be false (default for ZA market)
    expect(screen.getByTestId("lite-mode-value").textContent).toBe("false");

    // The switch must be findable by an accessible label so keyboard users can identify it
    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(screen.getByTestId("lite-mode-value").textContent).toBe("true");
    expect(toggle).toBeChecked();
  });

  it("toggle has a visible label text (AT-identifiable)", () => {
    render(
      <TestShell>
        <LiteModeSwitch />
      </TestShell>
    );

    // Must expose an accessible name that includes "Lite Mode" (case-insensitive)
    expect(
      screen.getByRole("checkbox", { name: /lite mode/i })
    ).toBeInTheDocument();
  });
});

// ── (b) toggling OFF sets liteMode = false ────────────────────────────────────

describe("LiteModeSwitch — toggle off", () => {
  it("sets liteMode to false in MarketContext when switched off after being on", async () => {
    const user = userEvent.setup();

    render(
      <TestShell>
        <LiteModeSwitch />
        <LiteModeReader />
      </TestShell>
    );

    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });

    // Turn on first
    await user.click(toggle);
    expect(screen.getByTestId("lite-mode-value").textContent).toBe("true");

    // Now turn off
    await user.click(toggle);
    expect(screen.getByTestId("lite-mode-value").textContent).toBe("false");
    expect(toggle).not.toBeChecked();
  });
});

// ── (c) cart contents unchanged after both toggle transitions (FR-026) ────────

describe("LiteModeSwitch — cart isolation (FR-026)", () => {
  it("cart items are unchanged after toggling lite mode on", async () => {
    const user = userEvent.setup();

    render(
      <TestShell>
        <CartSeeder />
        <LiteModeSwitch />
        <CartReader />
      </TestShell>
    );

    // Confirm cart has the seeded item before toggling
    await screen.findByText("iphone-15-pro");

    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });
    await user.click(toggle);

    // Cart must still contain the same product after toggle
    expect(screen.getByTestId("cart-items").textContent).toBe("iphone-15-pro");
  });

  it("cart items are unchanged after toggling lite mode off", async () => {
    const user = userEvent.setup();

    render(
      <TestShell>
        <CartSeeder />
        <LiteModeSwitch />
        <CartReader />
      </TestShell>
    );

    await screen.findByText("iphone-15-pro");

    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });
    // Toggle on then off
    await user.click(toggle);
    await user.click(toggle);

    expect(screen.getByTestId("cart-items").textContent).toBe("iphone-15-pro");
  });

  it("toggling lite mode does not reset multi-item cart", async () => {
    const user = userEvent.setup();

    /** Seeds two distinct products into the cart. */
    function MultiCartSeeder() {
      const { addItem } = useCart();
      React.useEffect(() => {
        addItem({ productId: "iphone-15-pro", quantity: 1, price: 24999 });
        addItem({ productId: "silicone-case", quantity: 1, price: 599 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <TestShell>
        <MultiCartSeeder />
        <LiteModeSwitch />
        <CartReader />
      </TestShell>
    );

    await screen.findByText(/iphone-15-pro/);

    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });
    await user.click(toggle);

    const cartText = screen.getByTestId("cart-items").textContent ?? "";
    expect(cartText).toContain("iphone-15-pro");
    expect(cartText).toContain("silicone-case");
  });
});

// ── LiteModeSwitch renders in the app shell (integration smoke) ───────────────

describe("LiteModeSwitch — presence in shell", () => {
  it("is present and operable without a page navigation", () => {
    render(
      <TestShell>
        <LiteModeSwitch />
      </TestShell>
    );

    const toggle = screen.getByRole("checkbox", { name: /lite mode/i });
    // Must be enabled (not disabled) so users can actually change it
    expect(toggle).not.toBeDisabled();
    expect(toggle).toBeInTheDocument();
  });
});
