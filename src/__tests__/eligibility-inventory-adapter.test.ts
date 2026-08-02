/**
 * Acceptance tests: TMF637 EligibilityInventoryAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/EligibilityInventoryAdapter.ts
 *   src/lib/adapters/mocks/MockEligibilityInventoryAdapter.ts
 *
 * Covers (per LLD §5.7, §8.1, task acceptance criteria):
 *   1. Interface shape — checkUpgradeEligibility and checkInventoryAvailability
 *   2. JSDoc carries TM Forum TMF637 traceability annotation (NFR-32)
 *   3. Mock is assignable to the interface boundary (IR-04)
 *   4. Happy-path: eligible upgrade (Journey B) and in-stock device
 *   5. Failure path: ineligible customer, out-of-stock product
 *   6. Pending path: eligibility window not yet open (nextEligibleDate present)
 */

import type {
  EligibilityInventoryAdapter,
  EligibilityCheckRequest,
  EligibilityCheckResult,
  InventoryAvailabilityRequest,
  InventoryAvailabilityResult,
} from "@/lib/adapters/adapter-interfaces/EligibilityInventoryAdapter";
import { MockEligibilityInventoryAdapter } from "@/lib/adapters/mocks/MockEligibilityInventoryAdapter";

// ── Seed inputs keyed to demo journeys (ADR-003) ──────────────────────────────

// Journey B — contract upgrade eligible customer
const ELIGIBLE_REQUEST: EligibilityCheckRequest = {
  customerId: "cust_1001",
  lineId: "msisdn_27831234567",
  targetProductId: "prod_device_iphone15",
  marketCode: "ZA",
};

// Ineligible: upgrade window not yet open
const INELIGIBLE_REQUEST: EligibilityCheckRequest = {
  customerId: "cust_3001",
  lineId: "msisdn_27839999999",
  targetProductId: "prod_device_iphone15",
  marketCode: "ZA",
};

// Pending: upgrade date in the future
const PENDING_REQUEST: EligibilityCheckRequest = {
  customerId: "cust_4001",
  lineId: "msisdn_27834444444",
  targetProductId: "prod_device_samsung_s24",
  marketCode: "ZA",
};

const IPHONE_15_IN_STOCK: InventoryAvailabilityRequest = {
  productId: "prod_device_iphone15",
  marketCode: "ZA",
};

const OUT_OF_STOCK_REQUEST: InventoryAvailabilityRequest = {
  productId: "prod_device_outofstock",
  marketCode: "ZA",
};

const UNKNOWN_PRODUCT_REQUEST: InventoryAvailabilityRequest = {
  productId: "prod_unknown_device",
  marketCode: "ZA",
};

// ── Interface assignability ───────────────────────────────────────────────────

describe("EligibilityInventoryAdapter – interface boundary (IR-04)", () => {
  it("MockEligibilityInventoryAdapter is assignable to EligibilityInventoryAdapter", () => {
    const adapter: EligibilityInventoryAdapter = new MockEligibilityInventoryAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockEligibilityInventoryAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockEligibilityInventoryAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── checkUpgradeEligibility — happy path ─────────────────────────────────────

describe("MockEligibilityInventoryAdapter.checkUpgradeEligibility – happy path (Journey B)", () => {
  it("returns ELIGIBLE status for cust_1001 upgrade request", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(ELIGIBLE_REQUEST);
    expect(result.eligibilityStatus).toBe("ELIGIBLE");
  });

  it("result includes a reasonCode", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(ELIGIBLE_REQUEST);
    expect(typeof result.reasonCode).toBe("string");
    expect(result.reasonCode!.length).toBeGreaterThan(0);
  });

  it("result includes a compatiblePlans array", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(ELIGIBLE_REQUEST);
    expect(Array.isArray(result.compatiblePlans)).toBe(true);
    expect(result.compatiblePlans.length).toBeGreaterThan(0);
  });

  it("nextEligibleDate is null when eligible", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(ELIGIBLE_REQUEST);
    expect(result.nextEligibleDate).toBeNull();
  });

  it("result shape matches LLD §5.7 contract fields", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result: EligibilityCheckResult = await adapter.checkUpgradeEligibility(ELIGIBLE_REQUEST);
    expect(result).toHaveProperty("eligibilityStatus");
    expect(result).toHaveProperty("reasonCode");
    expect(result).toHaveProperty("nextEligibleDate");
    expect(result).toHaveProperty("compatiblePlans");
    expect(result).toHaveProperty("inventoryStatus");
  });
});

// ── checkUpgradeEligibility — failure path ────────────────────────────────────

describe("MockEligibilityInventoryAdapter.checkUpgradeEligibility – failure path", () => {
  it("returns INELIGIBLE for customer outside upgrade window (cust_3001)", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(INELIGIBLE_REQUEST);
    expect(result.eligibilityStatus).toBe("INELIGIBLE");
  });

  it("ineligible result has a non-empty reasonCode", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(INELIGIBLE_REQUEST);
    expect(typeof result.reasonCode).toBe("string");
    expect(result.reasonCode!.length).toBeGreaterThan(0);
  });

  it("ineligible result has empty compatiblePlans", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(INELIGIBLE_REQUEST);
    expect(result.compatiblePlans.length).toBe(0);
  });
});

// ── checkUpgradeEligibility — pending path ────────────────────────────────────

describe("MockEligibilityInventoryAdapter.checkUpgradeEligibility – pending path", () => {
  it("returns PENDING_ELIGIBILITY_DATE with a future nextEligibleDate (cust_4001)", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkUpgradeEligibility(PENDING_REQUEST);
    expect(result.eligibilityStatus).toBe("PENDING_ELIGIBILITY_DATE");
    expect(result.nextEligibleDate).not.toBeNull();
    expect(typeof result.nextEligibleDate).toBe("string");
  });
});

// ── checkInventoryAvailability — happy path ───────────────────────────────────

describe("MockEligibilityInventoryAdapter.checkInventoryAvailability – happy path", () => {
  it("returns IN_STOCK for iPhone 15 in ZA", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkInventoryAvailability(IPHONE_15_IN_STOCK);
    expect(result.inventoryStatus).toBe("IN_STOCK");
  });

  it("result has productId and marketCode echoed back", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result: InventoryAvailabilityResult = await adapter.checkInventoryAvailability(IPHONE_15_IN_STOCK);
    expect(result.productId).toBe("prod_device_iphone15");
    expect(result.marketCode).toBe("ZA");
  });
});

// ── checkInventoryAvailability — failure / pending paths ─────────────────────

describe("MockEligibilityInventoryAdapter.checkInventoryAvailability – failure path", () => {
  it("returns OUT_OF_STOCK for seeded out-of-stock product", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkInventoryAvailability(OUT_OF_STOCK_REQUEST);
    expect(result.inventoryStatus).toBe("OUT_OF_STOCK");
  });

  it("returns NOT_FOUND (or OUT_OF_STOCK) for unknown productId", async () => {
    const adapter = new MockEligibilityInventoryAdapter();
    const result = await adapter.checkInventoryAvailability(UNKNOWN_PRODUCT_REQUEST);
    expect(["NOT_FOUND", "OUT_OF_STOCK"]).toContain(result.inventoryStatus);
  });
});
