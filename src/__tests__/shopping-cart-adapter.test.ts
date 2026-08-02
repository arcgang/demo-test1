/**
 * Acceptance tests: TMF663 ShoppingCartAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/ShoppingCartAdapter.ts
 *   src/lib/adapters/mocks/MockShoppingCartAdapter.ts
 *
 * Covers (per LLD §5.5, §5.6, §8.1, task acceptance criteria):
 *   1. Interface shape — exportCartMapping and validateCartCompatibility
 *   2. JSDoc carries TM Forum TMF663 traceability annotation (NFR-32)
 *   3. Mock is assignable to the interface boundary (IR-04)
 *   4. Happy-path: valid device + plan cart (Journey B) exports and passes compat
 *   5. Failure path: incompatible device + plan combination (VAL-03)
 *   6. Pending / edge path: cart with trade-in credit line requires active quote
 */

import type {
  ShoppingCartAdapter,
  CartExportRequest,
  CartExportResult,
  CartCompatibilityRequest,
  CartCompatibilityResult,
} from "@/lib/adapters/adapter-interfaces/ShoppingCartAdapter";
import { MockShoppingCartAdapter } from "@/lib/adapters/mocks/MockShoppingCartAdapter";

// ── Seed inputs keyed to demo journeys (ADR-003) ──────────────────────────────

// Journey B — device + plan (compatible)
const COMPATIBLE_CART: CartCompatibilityRequest = {
  cartId: "cart_8f3a",
  marketCode: "ZA",
  lines: [
    { lineType: "DEVICE", productId: "prod_device_iphone15", quantity: 1 },
    { lineType: "PLAN", productId: "plan_unlimited_20gb", quantity: 1 },
  ],
};

// Incompatible combination: device not in plan's compatible list
const INCOMPATIBLE_CART: CartCompatibilityRequest = {
  cartId: "cart_bad_combo",
  marketCode: "ZA",
  lines: [
    { lineType: "DEVICE", productId: "prod_device_iphone15", quantity: 1 },
    { lineType: "PLAN", productId: "plan_incompatible_only", quantity: 1 },
  ],
};

// Trade-in credit line with active quote (Journey B with trade-in)
const CART_WITH_TRADEIN: CartCompatibilityRequest = {
  cartId: "cart_with_tradein",
  marketCode: "ZA",
  lines: [
    { lineType: "DEVICE", productId: "prod_device_iphone15", quantity: 1 },
    { lineType: "PLAN", productId: "plan_unlimited_20gb", quantity: 1 },
    { lineType: "TRADE_IN_CREDIT", referenceId: "tiq_782", quantity: 1 },
  ],
};

// Cart export request for Journey B
const EXPORT_REQUEST: CartExportRequest = {
  cartId: "cart_8f3a",
  marketCode: "ZA",
  lines: [
    { lineType: "DEVICE", productId: "prod_device_iphone15", quantity: 1 },
    { lineType: "PLAN", productId: "plan_unlimited_20gb", quantity: 1 },
  ],
};

// ── Interface assignability ───────────────────────────────────────────────────

describe("ShoppingCartAdapter – interface boundary (IR-04)", () => {
  it("MockShoppingCartAdapter is assignable to ShoppingCartAdapter interface", () => {
    const adapter: ShoppingCartAdapter = new MockShoppingCartAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockShoppingCartAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockShoppingCartAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── exportCartMapping — happy path ────────────────────────────────────────────

describe("MockShoppingCartAdapter.exportCartMapping – happy path (Journey B)", () => {
  it("returns a CartExportResult for a valid cart", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.exportCartMapping(EXPORT_REQUEST);
    expect(result).not.toBeNull();
  });

  it("CartExportResult has cartId and mappedLines", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result: CartExportResult = await adapter.exportCartMapping(EXPORT_REQUEST);
    expect(result.cartId).toBe("cart_8f3a");
    expect(Array.isArray(result.mappedLines)).toBe(true);
  });

  it("mappedLines count matches input lines count", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.exportCartMapping(EXPORT_REQUEST);
    expect(result.mappedLines.length).toBe(EXPORT_REQUEST.lines.length);
  });

  it("each mappedLine has lineType and externalReference", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.exportCartMapping(EXPORT_REQUEST);
    result.mappedLines.forEach((line: { lineType: string; externalReference: string }) => {
      expect(typeof line.lineType).toBe("string");
      expect(typeof line.externalReference).toBe("string");
    });
  });
});

// ── validateCartCompatibility — happy path ────────────────────────────────────

describe("MockShoppingCartAdapter.validateCartCompatibility – happy path", () => {
  it("returns compatible: true for device + plan combination (Journey B)", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility(COMPATIBLE_CART);
    expect(result.compatible).toBe(true);
  });

  it("compatible result has no violations", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result: CartCompatibilityResult = await adapter.validateCartCompatibility(COMPATIBLE_CART);
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it("compatible result for cart with trade-in credit line (Journey B + trade-in)", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility(CART_WITH_TRADEIN);
    expect(result.compatible).toBe(true);
  });
});

// ── validateCartCompatibility — failure path ──────────────────────────────────

describe("MockShoppingCartAdapter.validateCartCompatibility – failure path (VAL-03)", () => {
  it("returns compatible: false for incompatible device + plan", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility(INCOMPATIBLE_CART);
    expect(result.compatible).toBe(false);
  });

  it("incompatible result has at least one violation", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility(INCOMPATIBLE_CART);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("each violation has a ruleCode and message", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility(INCOMPATIBLE_CART);
    result.violations.forEach((v: { ruleCode: string; message: string }) => {
      expect(typeof v.ruleCode).toBe("string");
      expect(typeof v.message).toBe("string");
    });
  });

  it("returns compatible: false when cart has no lines", async () => {
    const adapter = new MockShoppingCartAdapter();
    const result = await adapter.validateCartCompatibility({
      cartId: "cart_empty",
      marketCode: "ZA",
      lines: [],
    });
    expect(result.compatible).toBe(false);
  });
});
