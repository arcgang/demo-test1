/**
 * Unit tests: CatalogService – default and liteMode payload shapes
 *
 * MUST FAIL until src/lib/services/CatalogService.ts is created with:
 *   - getCatalog(marketCode, options?) returning full items by default
 *   - getCatalog(marketCode, { liteMode: true }) returning stripped items
 *
 * Full items include media fields: imageUrl, promoVideoUrl, alternateImages
 * Lite items omit those fields but retain:
 *   productId, name, price, badges, availabilityStatus, href
 */

import {
  CatalogService,
  type CatalogItem,
  type CatalogRepository,
} from "@/lib/services/CatalogService";

// ── Fixture data ──────────────────────────────────────────────────────────────

const IPHONE15_ROW = {
  productId: "prod_device_iphone15",
  marketCode: "ZA",
  productType: "DEVICE",
  name: "iPhone 15",
  priceOnceOff: 18999.0,
  priceRecurring: 0,
  currencyCode: "ZAR",
  availabilityStatus: "IN_STOCK",
  badges: ["5G", "Trade-In Eligible"],
  imageUrl: "https://cdn.example.com/iphone15-hires.jpg",
  promoVideoUrl: "https://cdn.example.com/iphone15-promo.mp4",
  alternateImages: [
    "https://cdn.example.com/iphone15-alt1.jpg",
    "https://cdn.example.com/iphone15-alt2.jpg",
  ],
};

const UNLIMITED_PLAN_ROW = {
  productId: "plan_unlimited_20gb",
  marketCode: "ZA",
  productType: "PLAN",
  name: "Unlimited 20GB",
  priceOnceOff: 0,
  priceRecurring: 799.0,
  currencyCode: "ZAR",
  availabilityStatus: "IN_STOCK",
  badges: ["5G"],
  imageUrl: "https://cdn.example.com/plan-unlimited-hires.jpg",
  promoVideoUrl: null,
  alternateImages: [],
};

const TZ_PRODUCT_ROW = {
  productId: "prod_sim_tz_basic",
  marketCode: "TZ",
  productType: "SIM",
  name: "Basic SIM – Tanzania",
  priceOnceOff: 5000,
  priceRecurring: 0,
  currencyCode: "TZS",
  availabilityStatus: "IN_STOCK",
  badges: [],
  imageUrl: "https://cdn.example.com/sim-tz-hires.jpg",
  promoVideoUrl: null,
  alternateImages: [],
};

function makeMockRepo(rows: typeof IPHONE15_ROW[]): jest.Mocked<CatalogRepository> {
  return {
    findByMarket: jest.fn((code: string) =>
      Promise.resolve(rows.filter((r) => r.marketCode === code))
    ),
  };
}

// ── Default (full) payload ────────────────────────────────────────────────────

describe("CatalogService.getCatalog – default (full) payload", () => {
  it("returns items for a known market code", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const items = await service.getCatalog("ZA");

    expect(items).toHaveLength(1);
  });

  it("returns empty array for a market with no products", async () => {
    const repo = makeMockRepo([]);
    const service = new CatalogService(repo);

    const items = await service.getCatalog("ZA");

    expect(items).toEqual([]);
  });

  it("only returns products belonging to the requested market", async () => {
    const repo = makeMockRepo([IPHONE15_ROW, TZ_PRODUCT_ROW]);
    const service = new CatalogService(repo);

    const items = await service.getCatalog("ZA");

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("prod_device_iphone15");
  });

  it("full item includes productId", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("productId", "prod_device_iphone15");
  });

  it("full item includes name", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("name", "iPhone 15");
  });

  it("full item includes price object with onceOff and currency", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("price");
    expect(item.price).toHaveProperty("onceOff", 18999.0);
    expect(item.price).toHaveProperty("currency", "ZAR");
  });

  it("full item includes badges array", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("badges");
    expect(Array.isArray(item.badges)).toBe(true);
    expect(item.badges).toContain("5G");
    expect(item.badges).toContain("Trade-In Eligible");
  });

  it("full item includes availabilityStatus", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("availabilityStatus", "IN_STOCK");
  });

  it("full item includes href pointing to product detail page", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("href");
    expect(typeof item.href).toBe("string");
    expect(item.href).toContain("prod_device_iphone15");
  });

  it("full item includes imageUrl (high-resolution)", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("imageUrl");
    expect(typeof item.imageUrl).toBe("string");
    expect((item.imageUrl as string).length).toBeGreaterThan(0);
  });

  it("full item includes promoVideoUrl", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("promoVideoUrl");
  });

  it("full item includes alternateImages array", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA");

    expect(item).toHaveProperty("alternateImages");
    expect(Array.isArray((item as CatalogItem & { alternateImages: unknown[] }).alternateImages)).toBe(true);
  });

  it("multiple products are all returned", async () => {
    const repo = makeMockRepo([IPHONE15_ROW, UNLIMITED_PLAN_ROW]);
    const service = new CatalogService(repo);

    const items = await service.getCatalog("ZA");

    expect(items).toHaveLength(2);
  });
});

// ── liteMode payload ──────────────────────────────────────────────────────────

describe("CatalogService.getCatalog – liteMode: true payload", () => {
  it("returns items for a known market code in liteMode", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const items = await service.getCatalog("ZA", { liteMode: true });

    expect(items).toHaveLength(1);
  });

  it("lite item retains productId", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("productId", "prod_device_iphone15");
  });

  it("lite item retains name", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("name", "iPhone 15");
  });

  it("lite item retains price with onceOff and currency", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("price");
    expect(item.price).toHaveProperty("onceOff", 18999.0);
    expect(item.price).toHaveProperty("currency", "ZAR");
  });

  it("lite item retains badges array", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("badges");
    expect(Array.isArray(item.badges)).toBe(true);
    expect(item.badges).toContain("5G");
  });

  it("lite item retains availabilityStatus", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("availabilityStatus", "IN_STOCK");
  });

  it("lite item retains href (View Details link)", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).toHaveProperty("href");
    expect(typeof item.href).toBe("string");
    expect(item.href).toContain("prod_device_iphone15");
  });

  it("lite item OMITS imageUrl", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).not.toHaveProperty("imageUrl");
  });

  it("lite item OMITS promoVideoUrl", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).not.toHaveProperty("promoVideoUrl");
  });

  it("lite item OMITS alternateImages", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);
    const [item] = await service.getCatalog("ZA", { liteMode: true });

    expect(item).not.toHaveProperty("alternateImages");
  });

  it("every key in the lite item also exists in the full item for the same product", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const [fullItem] = await service.getCatalog("ZA");
    const [liteItem] = await service.getCatalog("ZA", { liteMode: true });

    for (const key of Object.keys(liteItem)) {
      expect(fullItem).toHaveProperty(key);
    }
  });

  it("full item has more keys than lite item (media fields are additional)", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const [fullItem] = await service.getCatalog("ZA");
    const [liteItem] = await service.getCatalog("ZA", { liteMode: true });

    expect(Object.keys(fullItem).length).toBeGreaterThan(Object.keys(liteItem).length);
  });
});

// ── liteMode: false is identical to default ───────────────────────────────────

describe("CatalogService.getCatalog – liteMode: false equals default", () => {
  it("explicit liteMode:false returns imageUrl just like the default call", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const [item] = await service.getCatalog("ZA", { liteMode: false });

    expect(item).toHaveProperty("imageUrl");
  });

  it("explicit liteMode:false returns promoVideoUrl just like the default call", async () => {
    const repo = makeMockRepo([IPHONE15_ROW]);
    const service = new CatalogService(repo);

    const [item] = await service.getCatalog("ZA", { liteMode: false });

    expect(item).toHaveProperty("promoVideoUrl");
  });
});
