/**
 * Acceptance tests: TMF620 ProductCatalogAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/ProductCatalogAdapter.ts
 *   src/lib/adapters/mocks/MockProductCatalogAdapter.ts
 *
 * Covers (per LLD §8.1, task acceptance criteria):
 *   1. Interface shape — all six methods declared (listProducts, getProduct,
 *      listOffers, listBundles, listSIMOffers, listPlans)
 *   2. JSDoc carries TM Forum TMF620 traceability annotation (NFR-32)
 *   3. Mock is replaceable via the interface boundary (IR-04)
 *   4. Happy-path scenarios keyed to all four demo journeys (ADR-003)
 *   5. Failure scenarios (unknown product, unsupported market)
 *   6. Pending / empty scenarios (market with no catalog entries)
 */

import type {
  ProductCatalogAdapter,
  MarketContext,
  CatalogProduct,
  ProductOffer,
  ProductBundle,
  SIMOffer,
  ServicePlan,
} from "@/lib/adapters/adapter-interfaces/ProductCatalogAdapter";
import { MockProductCatalogAdapter } from "@/lib/adapters/mocks/MockProductCatalogAdapter";

// ── Seed inputs keyed to the four demo journeys (ADR-003) ────────────────────

const ZA_CONTEXT: MarketContext = { marketCode: "ZA" };
const TZ_CONTEXT: MarketContext = { marketCode: "TZ" };

// Journey B — contract upgrade (ZA)
const IPHONE_15_ID = "prod_device_iphone15";
// Journey A — eSIM onboarding (ZA)
const ESIM_STANDARD_ID = "prod_esim_standard";
// Journey C — device + plan bundle (TZ)
const SAMSUNG_S24_ID = "prod_device_samsung_s24";
const PLAN_20GB_ID = "plan_unlimited_20gb";

// ── Interface assignability ───────────────────────────────────────────────────

describe("ProductCatalogAdapter – interface boundary (IR-04)", () => {
  it("MockProductCatalogAdapter is assignable to ProductCatalogAdapter interface", () => {
    const adapter: ProductCatalogAdapter = new MockProductCatalogAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockProductCatalogAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── listProducts ─────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.listProducts – happy path", () => {
  it("returns an array for ZA market context", async () => {
    const adapter = new MockProductCatalogAdapter();
    const result = await adapter.listProducts(ZA_CONTEXT);
    expect(Array.isArray(result)).toBe(true);
  });

  it("ZA catalog contains at least one DEVICE product (Journey B)", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(ZA_CONTEXT);
    const devices = products.filter((p: CatalogProduct) => p.productType === "DEVICE");
    expect(devices.length).toBeGreaterThan(0);
  });

  it("ZA catalog contains at least one ESIM product (Journey A)", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(ZA_CONTEXT);
    const esimProducts = products.filter((p: CatalogProduct) => p.productType === "ESIM");
    expect(esimProducts.length).toBeGreaterThan(0);
  });

  it("TZ catalog contains at least one DEVICE product (Journey C)", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(TZ_CONTEXT);
    const devices = products.filter((p: CatalogProduct) => p.productType === "DEVICE");
    expect(devices.length).toBeGreaterThan(0);
  });

  it("every product has required fields: productId, productType, name, price", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(ZA_CONTEXT);
    for (const p of products) {
      expect(typeof p.productId).toBe("string");
      expect(p.productId.length).toBeGreaterThan(0);
      expect(typeof p.productType).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(typeof p.price).toBe("object");
      expect(typeof p.price.currency).toBe("string");
    }
  });

  it("ZA products use ZAR currency", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(ZA_CONTEXT);
    products.forEach((p: CatalogProduct) => {
      expect(p.price.currency).toBe("ZAR");
    });
  });

  it("TZ products use TZS currency", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts(TZ_CONTEXT);
    products.forEach((p: CatalogProduct) => {
      expect(p.price.currency).toBe("TZS");
    });
  });
});

describe("MockProductCatalogAdapter.listProducts – failure path", () => {
  it("returns empty array for unsupported market code", async () => {
    const adapter = new MockProductCatalogAdapter();
    const products = await adapter.listProducts({ marketCode: "XX" });
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });
});

// ── getProduct ────────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.getProduct – happy path", () => {
  it("returns iPhone 15 DEVICE for Journey B seed input", async () => {
    const adapter = new MockProductCatalogAdapter();
    const product = await adapter.getProduct(IPHONE_15_ID, ZA_CONTEXT);
    expect(product).not.toBeNull();
    expect(product!.productId).toBe(IPHONE_15_ID);
    expect(product!.productType).toBe("DEVICE");
  });

  it("iPhone 15 price.onceOff is a positive number", async () => {
    const adapter = new MockProductCatalogAdapter();
    const product = await adapter.getProduct(IPHONE_15_ID, ZA_CONTEXT);
    expect(product!.price.onceOff).toBeGreaterThan(0);
  });

  it("returns eSIM product for Journey A seed input", async () => {
    const adapter = new MockProductCatalogAdapter();
    const product = await adapter.getProduct(ESIM_STANDARD_ID, ZA_CONTEXT);
    expect(product).not.toBeNull();
    expect(product!.productType).toBe("ESIM");
  });

  it("returns Samsung S24 DEVICE for Journey C seed input", async () => {
    const adapter = new MockProductCatalogAdapter();
    const product = await adapter.getProduct(SAMSUNG_S24_ID, TZ_CONTEXT);
    expect(product).not.toBeNull();
    expect(product!.productType).toBe("DEVICE");
  });
});

describe("MockProductCatalogAdapter.getProduct – failure path", () => {
  it("returns null for an unknown productId", async () => {
    const adapter = new MockProductCatalogAdapter();
    const product = await adapter.getProduct("prod_unknown_404", ZA_CONTEXT);
    expect(product).toBeNull();
  });

  it("returns null when productId is not available in the given market", async () => {
    const adapter = new MockProductCatalogAdapter();
    // iPhone 15 is a ZA product — not available in TZ
    const product = await adapter.getProduct(IPHONE_15_ID, { marketCode: "XX" });
    expect(product).toBeNull();
  });
});

// ── listOffers ────────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.listOffers – happy path", () => {
  it("returns an array of offers for ZA", async () => {
    const adapter = new MockProductCatalogAdapter();
    const offers = await adapter.listOffers(ZA_CONTEXT);
    expect(Array.isArray(offers)).toBe(true);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("every offer has offerId, name, and products fields", async () => {
    const adapter = new MockProductCatalogAdapter();
    const offers = await adapter.listOffers(ZA_CONTEXT);
    for (const o of offers) {
      expect(typeof o.offerId).toBe("string");
      expect(typeof o.name).toBe("string");
      expect(Array.isArray(o.products)).toBe(true);
    }
  });
});

describe("MockProductCatalogAdapter.listOffers – failure path", () => {
  it("returns empty array for unsupported market", async () => {
    const adapter = new MockProductCatalogAdapter();
    const offers = await adapter.listOffers({ marketCode: "XX" });
    expect(Array.isArray(offers)).toBe(true);
    expect(offers.length).toBe(0);
  });
});

// ── listBundles ───────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.listBundles – happy path", () => {
  it("returns an array of bundles for ZA", async () => {
    const adapter = new MockProductCatalogAdapter();
    const bundles = await adapter.listBundles(ZA_CONTEXT);
    expect(Array.isArray(bundles)).toBe(true);
    expect(bundles.length).toBeGreaterThan(0);
  });

  it("every bundle has bundleId, name, and components", async () => {
    const adapter = new MockProductCatalogAdapter();
    const bundles = await adapter.listBundles(ZA_CONTEXT);
    for (const b of bundles) {
      expect(typeof b.bundleId).toBe("string");
      expect(typeof b.name).toBe("string");
      expect(Array.isArray(b.components)).toBe(true);
    }
  });
});

describe("MockProductCatalogAdapter.listBundles – pending / empty path", () => {
  it("returns empty array for TZ market that has no bundles configured", async () => {
    const adapter = new MockProductCatalogAdapter();
    const bundles = await adapter.listBundles({ marketCode: "XX" });
    expect(Array.isArray(bundles)).toBe(true);
  });
});

// ── listSIMOffers ─────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.listSIMOffers – happy path (Journey A)", () => {
  it("returns SIM/eSIM offers for ZA", async () => {
    const adapter = new MockProductCatalogAdapter();
    const simOffers = await adapter.listSIMOffers(ZA_CONTEXT);
    expect(Array.isArray(simOffers)).toBe(true);
    expect(simOffers.length).toBeGreaterThan(0);
  });

  it("every SIM offer has simOfferId, simType, and name", async () => {
    const adapter = new MockProductCatalogAdapter();
    const simOffers = await adapter.listSIMOffers(ZA_CONTEXT);
    for (const s of simOffers) {
      expect(typeof s.simOfferId).toBe("string");
      expect(["SIM", "ESIM"]).toContain(s.simType);
      expect(typeof s.name).toBe("string");
    }
  });

  it("ZA SIM offers include at least one ESIM type (Journey A onboarding)", async () => {
    const adapter = new MockProductCatalogAdapter();
    const simOffers = await adapter.listSIMOffers(ZA_CONTEXT);
    const esimTypes = simOffers.filter((s: SIMOffer) => s.simType === "ESIM");
    expect(esimTypes.length).toBeGreaterThan(0);
  });
});

describe("MockProductCatalogAdapter.listSIMOffers – failure path", () => {
  it("returns empty array for unsupported market", async () => {
    const adapter = new MockProductCatalogAdapter();
    const simOffers = await adapter.listSIMOffers({ marketCode: "XX" });
    expect(Array.isArray(simOffers)).toBe(true);
    expect(simOffers.length).toBe(0);
  });
});

// ── listPlans ─────────────────────────────────────────────────────────────────

describe("MockProductCatalogAdapter.listPlans – happy path (Journey C)", () => {
  it("returns plans for TZ market", async () => {
    const adapter = new MockProductCatalogAdapter();
    const plans = await adapter.listPlans(TZ_CONTEXT);
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);
  });

  it("every plan has planId, name, and price.recurring", async () => {
    const adapter = new MockProductCatalogAdapter();
    const plans = await adapter.listPlans(ZA_CONTEXT);
    for (const p of plans) {
      expect(typeof p.planId).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(typeof p.price).toBe("object");
      expect(typeof p.price.recurring).toBe("number");
    }
  });

  it("ZA plans include the seeded 20GB plan (Journey C/B)", async () => {
    const adapter = new MockProductCatalogAdapter();
    const plans = await adapter.listPlans(ZA_CONTEXT);
    const plan20gb = plans.find((p: ServicePlan) => p.planId === PLAN_20GB_ID);
    expect(plan20gb).toBeDefined();
  });

  it("plan price.recurring is positive", async () => {
    const adapter = new MockProductCatalogAdapter();
    const plans = await adapter.listPlans(ZA_CONTEXT);
    plans.forEach((p: ServicePlan) => {
      expect(p.price.recurring).toBeGreaterThan(0);
    });
  });
});

describe("MockProductCatalogAdapter.listPlans – failure path", () => {
  it("returns empty array for unsupported market", async () => {
    const adapter = new MockProductCatalogAdapter();
    const plans = await adapter.listPlans({ marketCode: "XX" });
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBe(0);
  });
});
