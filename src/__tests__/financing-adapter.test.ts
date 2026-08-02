/**
 * Acceptance tests: FinancingAdapter interface and MockFinancingAdapter
 * — verifies getFinancingOptions, calculateMonthlyPayment, submitFinancingApplication
 *   with seeded option sets keyed to upgrade journey inputs (LLD §5.8, IR-04, NFR-32).
 *
 * Tests MUST FAIL until the following are implemented:
 *   1. Interface FinancingAdapter exported from @/lib/adapters/FinancingAdapter
 *   2. Class MockFinancingAdapter exported from @/lib/adapters/mocks/MockFinancingAdapter
 *      implementing FinancingAdapter.
 */

import {
  type FinancingAdapter,
  type FinancingOptionsInput,
  type FinancingOption,
  type FinancingOptionsResult,
  type MonthlyPaymentInput,
  type FinancingApplicationInput,
  type FinancingApplicationResult,
} from "@/lib/adapters/FinancingAdapter";
import { MockFinancingAdapter } from "@/lib/adapters/mocks/MockFinancingAdapter";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OPTIONS_INPUT: FinancingOptionsInput = {
  customerId: "cust_1001",
  productId: "prod_device_iphone15",
  marketCode: "ZA",
  downPaymentAmount: 2000.0,
};

const MONTHLY_INPUT: MonthlyPaymentInput = {
  productId: "prod_device_iphone15",
  marketCode: "ZA",
  tenureMonths: 24,
  downPaymentAmount: 2000.0,
};

const APPLICATION_INPUT: FinancingApplicationInput = {
  customerId: "cust_1001",
  productId: "prod_device_iphone15",
  marketCode: "ZA",
  financeQuoteId: "fin_451",
  tenureMonths: 24,
  downPaymentAmount: 2000.0,
};

// ── Interface compliance ───────────────────────────────────────────────────────

describe("FinancingAdapter – interface compliance", () => {
  it("MockFinancingAdapter implements FinancingAdapter", () => {
    const adapter: FinancingAdapter = new MockFinancingAdapter();
    expect(adapter).toBeDefined();
  });

  it("exposes getFinancingOptions as a function", () => {
    const adapter: FinancingAdapter = new MockFinancingAdapter();
    expect(typeof adapter.getFinancingOptions).toBe("function");
  });

  it("exposes calculateMonthlyPayment as a function", () => {
    const adapter: FinancingAdapter = new MockFinancingAdapter();
    expect(typeof adapter.calculateMonthlyPayment).toBe("function");
  });

  it("exposes submitFinancingApplication as a function", () => {
    const adapter: FinancingAdapter = new MockFinancingAdapter();
    expect(typeof adapter.submitFinancingApplication).toBe("function");
  });
});

// ── getFinancingOptions ───────────────────────────────────────────────────────

describe("MockFinancingAdapter.getFinancingOptions – happy path", () => {
  it("returns a FinancingOptionsResult with a financeQuoteId", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    expect(typeof result.financeQuoteId).toBe("string");
    expect(result.financeQuoteId.length).toBeGreaterThan(0);
  });

  it("returns status QUOTED", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    expect(result.status).toBe("QUOTED");
  });

  it("returns at least one financing option", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    expect(Array.isArray(result.options)).toBe(true);
    expect(result.options.length).toBeGreaterThan(0);
  });

  it("each option has tenureMonths as a positive number", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    for (const opt of result.options) {
      expect(typeof opt.tenureMonths).toBe("number");
      expect(opt.tenureMonths).toBeGreaterThan(0);
    }
  });

  it("each option has monthlyAmount as a positive number", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    for (const opt of result.options) {
      expect(typeof opt.monthlyAmount).toBe("number");
      expect(opt.monthlyAmount).toBeGreaterThan(0);
    }
  });

  it("each option has an interestLabel string", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    for (const opt of result.options) {
      expect(typeof opt.interestLabel).toBe("string");
    }
  });

  it("each option has requiresFinalApproval as a boolean", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions(OPTIONS_INPUT);
    for (const opt of result.options) {
      expect(typeof opt.requiresFinalApproval).toBe("boolean");
    }
  });
});

describe("MockFinancingAdapter.getFinancingOptions – seeded by productId", () => {
  it("returns options for iPhone 15 (prod_device_iphone15)", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions({
      ...OPTIONS_INPUT,
      productId: "prod_device_iphone15",
    });
    expect(result.options.length).toBeGreaterThan(0);
  });

  it("returns options for S24 Ultra (prod_device_s24ultra)", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.getFinancingOptions({
      ...OPTIONS_INPUT,
      productId: "prod_device_s24ultra",
    });
    expect(result.options.length).toBeGreaterThan(0);
  });

  it("higher down payment reduces the monthlyAmount relative to zero down payment", async () => {
    const adapter = new MockFinancingAdapter();
    const withDown = await adapter.getFinancingOptions({
      ...OPTIONS_INPUT,
      downPaymentAmount: 5000,
    });
    const withoutDown = await adapter.getFinancingOptions({
      ...OPTIONS_INPUT,
      downPaymentAmount: 0,
    });
    const monthly24WithDown = withDown.options.find((o) => o.tenureMonths === 24)?.monthlyAmount;
    const monthly24WithoutDown = withoutDown.options.find((o) => o.tenureMonths === 24)?.monthlyAmount;
    if (monthly24WithDown !== undefined && monthly24WithoutDown !== undefined) {
      expect(monthly24WithDown).toBeLessThan(monthly24WithoutDown);
    }
  });
});

// ── calculateMonthlyPayment ───────────────────────────────────────────────────

describe("MockFinancingAdapter.calculateMonthlyPayment", () => {
  it("returns a positive monthly payment amount", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.calculateMonthlyPayment(MONTHLY_INPUT);
    expect(typeof result.monthlyAmount).toBe("number");
    expect(result.monthlyAmount).toBeGreaterThan(0);
  });

  it("returns tenureMonths matching input", async () => {
    const adapter = new MockFinancingAdapter();
    const result = await adapter.calculateMonthlyPayment(MONTHLY_INPUT);
    expect(result.tenureMonths).toBe(MONTHLY_INPUT.tenureMonths);
  });

  it("longer tenure produces a lower monthly payment", async () => {
    const adapter = new MockFinancingAdapter();
    const short = await adapter.calculateMonthlyPayment({ ...MONTHLY_INPUT, tenureMonths: 12 });
    const long = await adapter.calculateMonthlyPayment({ ...MONTHLY_INPUT, tenureMonths: 36 });
    expect(short.monthlyAmount).toBeGreaterThan(long.monthlyAmount);
  });
});

// ── submitFinancingApplication ────────────────────────────────────────────────

describe("MockFinancingAdapter.submitFinancingApplication – approved", () => {
  it("returns applicationStatus APPROVED on happy path", async () => {
    const adapter = new MockFinancingAdapter({ scenario: "approved" });
    const result = await adapter.submitFinancingApplication(APPLICATION_INPUT);
    expect(result.applicationStatus).toBe("APPROVED");
  });

  it("returns a non-empty applicationReference", async () => {
    const adapter = new MockFinancingAdapter({ scenario: "approved" });
    const result = await adapter.submitFinancingApplication(APPLICATION_INPUT);
    expect(typeof result.applicationReference).toBe("string");
    expect(result.applicationReference.length).toBeGreaterThan(0);
  });
});

describe("MockFinancingAdapter.submitFinancingApplication – declined", () => {
  it("returns applicationStatus DECLINED on failure scenario", async () => {
    const adapter = new MockFinancingAdapter({ scenario: "declined" });
    const result = await adapter.submitFinancingApplication(APPLICATION_INPUT);
    expect(result.applicationStatus).toBe("DECLINED");
  });

  it("declined result includes a reason string", async () => {
    const adapter = new MockFinancingAdapter({ scenario: "declined" });
    const result = await adapter.submitFinancingApplication(APPLICATION_INPUT);
    expect(typeof result.reason).toBe("string");
    expect(result.reason!.length).toBeGreaterThan(0);
  });
});

describe("MockFinancingAdapter.submitFinancingApplication – pending", () => {
  it("returns applicationStatus PENDING on pending scenario", async () => {
    const adapter = new MockFinancingAdapter({ scenario: "pending" });
    const result = await adapter.submitFinancingApplication(APPLICATION_INPUT);
    expect(result.applicationStatus).toBe("PENDING");
  });
});

// ── FinancingOptionsResult shape ──────────────────────────────────────────────

describe("FinancingOptionsResult shape (LLD §5.8)", () => {
  it("contains financeQuoteId, status, and options array", async () => {
    const adapter = new MockFinancingAdapter();
    const result: FinancingOptionsResult = await adapter.getFinancingOptions(OPTIONS_INPUT);
    expect(result).toHaveProperty("financeQuoteId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("options");
  });
});

// ── Instance isolation ────────────────────────────────────────────────────────

describe("MockFinancingAdapter – instance isolation", () => {
  it("quoteCounter restarts from initial value (fin_451) on each new instance", async () => {
    const adapter1 = new MockFinancingAdapter();
    const adapter2 = new MockFinancingAdapter();
    const r1 = await adapter1.getFinancingOptions(OPTIONS_INPUT);
    const r2 = await adapter2.getFinancingOptions(OPTIONS_INPUT);
    expect(r1.financeQuoteId).toBe("fin_451");
    expect(r2.financeQuoteId).toBe("fin_451");
  });
});
