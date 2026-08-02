/**
 * Acceptance tests: TradeInAdapter interface and MockTradeInAdapter
 * — verifies getValuationEstimate, submitTradeInRequest, confirmTradeInCredit
 *   with deterministic valuations keyed to brand, model, storage, and condition
 *   (LLD §5.9, IR-04, NFR-32).
 *
 * Tests MUST FAIL until the following are implemented:
 *   1. Interface TradeInAdapter exported from @/lib/adapters/TradeInAdapter
 *   2. Class MockTradeInAdapter exported from @/lib/adapters/mocks/MockTradeInAdapter
 *      implementing TradeInAdapter.
 */

import {
  type TradeInAdapter,
  type TradeInDevice,
  type ValuationEstimateInput,
  type ValuationEstimateResult,
  type TradeInRequestInput,
  type TradeInRequestResult,
  type TradeInCreditConfirmInput,
  type TradeInCreditConfirmResult,
} from "@/lib/adapters/TradeInAdapter";
import { MockTradeInAdapter } from "@/lib/adapters/mocks/MockTradeInAdapter";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GOOD_IPHONE_12: TradeInDevice = {
  brand: "Apple",
  model: "iPhone 12",
  storageGb: 128,
  condition: "GOOD",
  screenCondition: "MINOR_SCRATCHES",
};

const FAIR_SAMSUNG_S21: TradeInDevice = {
  brand: "Samsung",
  model: "Galaxy S21",
  storageGb: 256,
  condition: "FAIR",
  screenCondition: "CRACKED",
};

const EXCELLENT_IPHONE_14: TradeInDevice = {
  brand: "Apple",
  model: "iPhone 14",
  storageGb: 128,
  condition: "EXCELLENT",
  screenCondition: "NO_DAMAGE",
};

// ── Interface compliance ───────────────────────────────────────────────────────

describe("TradeInAdapter – interface compliance", () => {
  it("MockTradeInAdapter implements TradeInAdapter", () => {
    const adapter: TradeInAdapter = new MockTradeInAdapter();
    expect(adapter).toBeDefined();
  });

  it("exposes getValuationEstimate as a function", () => {
    const adapter: TradeInAdapter = new MockTradeInAdapter();
    expect(typeof adapter.getValuationEstimate).toBe("function");
  });

  it("exposes submitTradeInRequest as a function", () => {
    const adapter: TradeInAdapter = new MockTradeInAdapter();
    expect(typeof adapter.submitTradeInRequest).toBe("function");
  });

  it("exposes confirmTradeInCredit as a function", () => {
    const adapter: TradeInAdapter = new MockTradeInAdapter();
    expect(typeof adapter.confirmTradeInCredit).toBe("function");
  });
});

// ── getValuationEstimate ──────────────────────────────────────────────────────

describe("MockTradeInAdapter.getValuationEstimate – result shape", () => {
  it("returns a tradeInQuoteId string", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(typeof result.tradeInQuoteId).toBe("string");
    expect(result.tradeInQuoteId.length).toBeGreaterThan(0);
  });

  it("returns status QUOTED", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(result.status).toBe("QUOTED");
  });

  it("returns a positive estimatedCredit", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(typeof result.estimatedCredit).toBe("number");
    expect(result.estimatedCredit).toBeGreaterThan(0);
  });

  it("returns currency matching the market", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(result.currency).toBe("ZAR");
  });

  it("returns an expiresAt ISO timestamp string", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(typeof result.expiresAt).toBe("string");
    expect(() => new Date(result.expiresAt)).not.toThrow();
  });

  it("returns a disclaimer string", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(typeof result.disclaimer).toBe("string");
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });
});

describe("MockTradeInAdapter.getValuationEstimate – deterministic by device", () => {
  it("EXCELLENT condition yields higher credit than GOOD for same device", async () => {
    const adapter = new MockTradeInAdapter();
    const excellent = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: EXCELLENT_IPHONE_14,
    });
    const good = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: { ...EXCELLENT_IPHONE_14, condition: "GOOD", screenCondition: "MINOR_SCRATCHES" },
    });
    expect(excellent.estimatedCredit).toBeGreaterThanOrEqual(good.estimatedCredit);
  });

  it("GOOD condition yields higher credit than FAIR for same device", async () => {
    const adapter = new MockTradeInAdapter();
    const good = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    const fair = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: { ...GOOD_IPHONE_12, condition: "FAIR", screenCondition: "CRACKED" },
    });
    expect(good.estimatedCredit).toBeGreaterThan(fair.estimatedCredit);
  });

  it("Apple brand yields a non-zero credit estimate", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(result.estimatedCredit).toBeGreaterThan(0);
  });

  it("Samsung brand yields a non-zero credit estimate", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: FAIR_SAMSUNG_S21,
    });
    expect(result.estimatedCredit).toBeGreaterThan(0);
  });

  it("larger storage yields equal or higher credit than smaller storage", async () => {
    const adapter = new MockTradeInAdapter();
    const large = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: { ...GOOD_IPHONE_12, storageGb: 256 },
    });
    const small = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: { ...GOOD_IPHONE_12, storageGb: 64 },
    });
    expect(large.estimatedCredit).toBeGreaterThanOrEqual(small.estimatedCredit);
  });

  it("same inputs produce the same estimate (deterministic)", async () => {
    const adapter = new MockTradeInAdapter();
    const first = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    const second = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(first.estimatedCredit).toBe(second.estimatedCredit);
  });
});

// ── submitTradeInRequest ──────────────────────────────────────────────────────

describe("MockTradeInAdapter.submitTradeInRequest", () => {
  it("returns a tradeInRequestId string", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.submitTradeInRequest({
      customerId: "cust_1001",
      marketCode: "ZA",
      tradeInQuoteId: "tiq_782",
      device: GOOD_IPHONE_12,
    });
    expect(typeof result.tradeInRequestId).toBe("string");
    expect(result.tradeInRequestId.length).toBeGreaterThan(0);
  });

  it("returns requestStatus SUBMITTED or ACCEPTED", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.submitTradeInRequest({
      customerId: "cust_1001",
      marketCode: "ZA",
      tradeInQuoteId: "tiq_782",
      device: GOOD_IPHONE_12,
    });
    expect(["SUBMITTED", "ACCEPTED"]).toContain(result.requestStatus);
  });

  it("references the input tradeInQuoteId", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.submitTradeInRequest({
      customerId: "cust_1001",
      marketCode: "ZA",
      tradeInQuoteId: "tiq_782",
      device: GOOD_IPHONE_12,
    });
    expect(result.tradeInQuoteId).toBe("tiq_782");
  });
});

// ── confirmTradeInCredit ──────────────────────────────────────────────────────

describe("MockTradeInAdapter.confirmTradeInCredit", () => {
  it("returns confirmed credit amount", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.confirmTradeInCredit({
      tradeInRequestId: "tir_001",
      tradeInQuoteId: "tiq_782",
      marketCode: "ZA",
    });
    expect(typeof result.confirmedCreditAmount).toBe("number");
    expect(result.confirmedCreditAmount).toBeGreaterThanOrEqual(0);
  });

  it("returns creditStatus CONFIRMED or ADJUSTED", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.confirmTradeInCredit({
      tradeInRequestId: "tir_001",
      tradeInQuoteId: "tiq_782",
      marketCode: "ZA",
    });
    expect(["CONFIRMED", "ADJUSTED"]).toContain(result.creditStatus);
  });

  it("returns currency string", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.confirmTradeInCredit({
      tradeInRequestId: "tir_001",
      tradeInQuoteId: "tiq_782",
      marketCode: "ZA",
    });
    expect(typeof result.currency).toBe("string");
    expect(result.currency.length).toBeGreaterThan(0);
  });
});

// ── ValuationEstimateResult shape (LLD §5.9) ──────────────────────────────────

describe("ValuationEstimateResult shape (LLD §5.9)", () => {
  it("contains tradeInQuoteId, status, estimatedCredit, currency, expiresAt, disclaimer", async () => {
    const adapter = new MockTradeInAdapter();
    const result: ValuationEstimateResult = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(result).toHaveProperty("tradeInQuoteId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("estimatedCredit");
    expect(result).toHaveProperty("currency");
    expect(result).toHaveProperty("expiresAt");
    expect(result).toHaveProperty("disclaimer");
  });

  it("expiresAt is never in the past", async () => {
    const adapter = new MockTradeInAdapter();
    const result = await adapter.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

// ── Instance isolation ────────────────────────────────────────────────────────

describe("MockTradeInAdapter – instance isolation", () => {
  it("quoteCounter restarts from initial value (tiq_781) on each new instance", async () => {
    const adapter1 = new MockTradeInAdapter();
    const adapter2 = new MockTradeInAdapter();
    const r1 = await adapter1.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    const r2 = await adapter2.getValuationEstimate({
      customerId: "cust_1001",
      marketCode: "ZA",
      device: GOOD_IPHONE_12,
    });
    expect(r1.tradeInQuoteId).toBe("tiq_781");
    expect(r2.tradeInQuoteId).toBe("tiq_781");
  });

  it("requestCounter restarts from tir_001 on each new instance", async () => {
    const adapter1 = new MockTradeInAdapter();
    const adapter2 = new MockTradeInAdapter();
    const r1 = await adapter1.submitTradeInRequest({
      customerId: "cust_1001",
      marketCode: "ZA",
      tradeInQuoteId: "tiq_781",
      device: GOOD_IPHONE_12,
    });
    const r2 = await adapter2.submitTradeInRequest({
      customerId: "cust_1001",
      marketCode: "ZA",
      tradeInQuoteId: "tiq_781",
      device: GOOD_IPHONE_12,
    });
    expect(r1.tradeInRequestId).toBe("tir_001");
    expect(r2.tradeInRequestId).toBe("tir_001");
  });
});
