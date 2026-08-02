/**
 * Acceptance tests: GET /api/markets/{marketCode}/catalog
 * — filter params, pagination, product seed data, and item shape (LLD §5.2)
 *
 * Tests MUST FAIL until:
 *   1. Six wireframe products are seeded for the ZA market.
 *   2. Query params brand, priceMin, priceMax, storage, availability, page,
 *      pageSize are accepted and applied to the catalog query.
 *   3. Each catalog item exposes: productId, productType, name,
 *      price.onceOff, price.monthlyFrom, eligibilityHint,
 *      availableAttachments, badges.
 *   4. Every response includes a pagination envelope:
 *      currentPage, pageSize, totalPages, totalItems.
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/markets/[marketCode]/catalog/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  marketCode: string,
  query: Record<string, string> = {}
): NextRequest {
  const qs = new URLSearchParams(query).toString();
  const url = `http://localhost/api/markets/${marketCode}/catalog${qs ? `?${qs}` : ""}`;
  return new NextRequest(url);
}

function makeParams(marketCode: string): { params: { marketCode: string } } {
  return { params: { marketCode } };
}

// ── Catalog item shape (LLD §5.2) ─────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – catalog item shape (LLD §5.2)", () => {
  it("catalog array is non-empty for ZA market", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
  });

  it("each catalog item has a string 'productId' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("productId");
      expect(typeof item.productId).toBe("string");
      expect(item.productId.length).toBeGreaterThan(0);
    }
  });

  it("each catalog item has a string 'productType' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("productType");
      expect(typeof item.productType).toBe("string");
    }
  });

  it("each catalog item has a non-empty string 'name' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("name");
      expect(typeof item.name).toBe("string");
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("each catalog item has a 'price' object with numeric 'onceOff'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("price");
      expect(item.price).toHaveProperty("onceOff");
      expect(typeof item.price.onceOff).toBe("number");
    }
  });

  it("each catalog item has a 'price' object with numeric 'monthlyFrom'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("price");
      expect(item.price).toHaveProperty("monthlyFrom");
      expect(typeof item.price.monthlyFrom).toBe("number");
    }
  });

  it("each catalog item has an 'eligibilityHint' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("eligibilityHint");
    }
  });

  it("each catalog item has an 'availableAttachments' array", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("availableAttachments");
      expect(Array.isArray(item.availableAttachments)).toBe(true);
    }
  });

  it("each catalog item has a 'badges' array", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item).toHaveProperty("badges");
      expect(Array.isArray(item.badges)).toBe(true);
    }
  });
});

// ── Seeded products ────────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – seeded ZA products", () => {
  it("returns at least 6 products for ZA (wireframe minimum)", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThanOrEqual(6);
  });

  it("includes iPhone 15 Pro at R24,999 with 5G and Trade-In Eligible badges", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) =>
      p.name.toLowerCase().includes("iphone 15 pro")
    );
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(24999);
    expect(item.badges).toContain("5G");
    expect(item.badges).toContain("Trade-In Eligible");
  });

  it("includes Samsung Galaxy S24 Ultra at R22,999 with 5G badge only", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) =>
      p.name.toLowerCase().includes("s24 ultra")
    );
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(22999);
    expect(item.badges).toContain("5G");
    expect(item.badges).not.toContain("Trade-In Eligible");
  });

  it("includes iPhone 15 128GB at R18,999 with 5G and Trade-In Eligible badges", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) => {
      const n = p.name.toLowerCase();
      return n.includes("iphone 15") && !n.includes("pro") && n.includes("128");
    });
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(18999);
    expect(item.badges).toContain("5G");
    expect(item.badges).toContain("Trade-In Eligible");
  });

  it("includes Samsung Galaxy S24 256GB at R16,999 with 5G badge", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) => {
      const n = p.name.toLowerCase();
      return n.includes("galaxy s24") && !n.includes("ultra") && n.includes("256");
    });
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(16999);
    expect(item.badges).toContain("5G");
  });

  it("includes Samsung Galaxy A54 128GB at R8,999 with 5G badge", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) =>
      p.name.toLowerCase().includes("a54")
    );
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(8999);
    expect(item.badges).toContain("5G");
  });

  it("includes iPhone 14 128GB at R15,999 with 5G and Trade-In Eligible badges", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    const item = body.catalog.find((p: { name: string }) =>
      p.name.toLowerCase().includes("iphone 14")
    );
    expect(item).toBeDefined();
    expect(item.price.onceOff).toBe(15999);
    expect(item.badges).toContain("5G");
    expect(item.badges).toContain("Trade-In Eligible");
  });
});

// ── Pagination metadata ────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – pagination metadata", () => {
  it("response includes a top-level 'pagination' object", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body).toHaveProperty("pagination");
    expect(typeof body.pagination).toBe("object");
    expect(body.pagination).not.toBeNull();
  });

  it("pagination has numeric 'currentPage'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination).toHaveProperty("currentPage");
    expect(typeof body.pagination.currentPage).toBe("number");
  });

  it("pagination has numeric 'pageSize'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination).toHaveProperty("pageSize");
    expect(typeof body.pagination.pageSize).toBe("number");
  });

  it("pagination has numeric 'totalPages'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination).toHaveProperty("totalPages");
    expect(typeof body.pagination.totalPages).toBe("number");
  });

  it("pagination has numeric 'totalItems'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination).toHaveProperty("totalItems");
    expect(typeof body.pagination.totalItems).toBe("number");
  });

  it("default currentPage is 1", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination.currentPage).toBe(1);
  });

  it("default pageSize is 12", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination.pageSize).toBe(12);
  });

  it("totalItems >= 6 for ZA (all seeded products)", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.pagination.totalItems).toBeGreaterThanOrEqual(6);
  });

  it("totalPages is 1 when all items fit within the default pageSize of 12", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    // Seed has 6 products; default pageSize is 12 so one page suffices
    expect(body.pagination.totalPages).toBe(1);
  });

  it("catalog.length equals totalItems when all items fit on one page", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body.catalog.length).toBe(body.pagination.totalItems);
  });
});

// ── Page / pageSize slicing ────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – page/pageSize slicing", () => {
  it("page=1&pageSize=2 returns exactly 2 items", async () => {
    const response = await GET(
      makeRequest("ZA", { page: "1", pageSize: "2" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBe(2);
  });

  it("page=1&pageSize=2 sets currentPage=1 and pageSize=2 in pagination", async () => {
    const response = await GET(
      makeRequest("ZA", { page: "1", pageSize: "2" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.currentPage).toBe(1);
    expect(body.pagination.pageSize).toBe(2);
  });

  it("page=1&pageSize=2 gives totalPages = ceil(totalItems / 2)", async () => {
    const response = await GET(
      makeRequest("ZA", { page: "1", pageSize: "2" }),
      makeParams("ZA")
    );
    const body = await response.json();
    const expected = Math.ceil(body.pagination.totalItems / 2);
    expect(body.pagination.totalPages).toBe(expected);
  });

  it("page=1&pageSize=2 gives totalPages=3 for the 6 seeded ZA products", async () => {
    const response = await GET(
      makeRequest("ZA", { page: "1", pageSize: "2" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(6);
    expect(body.pagination.totalPages).toBe(3);
  });

  it("page=2&pageSize=2 returns a non-overlapping slice vs page=1", async () => {
    const [r1, r2] = await Promise.all([
      GET(makeRequest("ZA", { page: "1", pageSize: "2" }), makeParams("ZA")),
      GET(makeRequest("ZA", { page: "2", pageSize: "2" }), makeParams("ZA")),
    ]);
    const b1 = await r1.json();
    const b2 = await r2.json();
    expect(b2.pagination.currentPage).toBe(2);
    expect(b2.catalog.length).toBe(2);
    const ids1: string[] = b1.catalog.map((i: { productId: string }) => i.productId);
    const ids2: string[] = b2.catalog.map((i: { productId: string }) => i.productId);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("page=3&pageSize=2 returns the last 2 items (no overlap with pages 1 or 2)", async () => {
    const [r1, r2, r3] = await Promise.all([
      GET(makeRequest("ZA", { page: "1", pageSize: "2" }), makeParams("ZA")),
      GET(makeRequest("ZA", { page: "2", pageSize: "2" }), makeParams("ZA")),
      GET(makeRequest("ZA", { page: "3", pageSize: "2" }), makeParams("ZA")),
    ]);
    const [b1, b2, b3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
    const allIds = [
      ...b1.catalog.map((i: { productId: string }) => i.productId),
      ...b2.catalog.map((i: { productId: string }) => i.productId),
      ...b3.catalog.map((i: { productId: string }) => i.productId),
    ];
    // All 6 unique IDs across three pages
    expect(new Set(allIds).size).toBe(6);
  });

  it("page=1&pageSize=12 returns all products when seed <= 12", async () => {
    const response = await GET(
      makeRequest("ZA", { page: "1", pageSize: "12" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBe(body.pagination.totalItems);
    expect(body.pagination.totalPages).toBe(1);
  });
});

// ── Brand filter ───────────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – brand filter", () => {
  it("brand=Apple returns fewer products than the unfiltered catalog", async () => {
    const [rAll, rApple] = await Promise.all([
      GET(makeRequest("ZA"), makeParams("ZA")),
      GET(makeRequest("ZA", { brand: "Apple" }), makeParams("ZA")),
    ]);
    const [all, apple] = await Promise.all([rAll.json(), rApple.json()]);
    expect(apple.pagination.totalItems).toBeLessThan(all.pagination.totalItems);
  });

  it("brand=Apple returns exactly 3 Apple products from the 6 seeded items", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(3);
  });

  it("brand=Apple returns only iPhone products (no Samsung)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.name.toLowerCase()).not.toContain("samsung");
    }
  });

  it("brand=Samsung returns exactly 3 Samsung products from the 6 seeded items", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Samsung" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(3);
  });

  it("brand=Samsung returns only Samsung products (no iPhone)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Samsung" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.name.toLowerCase()).toContain("samsung");
    }
  });

  it("brand=Apple,Samsung (comma-separated) returns all 6 seeded products", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple,Samsung" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(6);
  });

  it("brand=Apple,Samsung result includes both iPhone and Samsung products", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple,Samsung" }),
      makeParams("ZA")
    );
    const body = await response.json();
    const names: string[] = body.catalog.map((i: { name: string }) =>
      i.name.toLowerCase()
    );
    expect(names.some((n) => n.includes("iphone"))).toBe(true);
    expect(names.some((n) => n.includes("samsung"))).toBe(true);
  });
});

// ── Price range filter ─────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – price range filter", () => {
  it("priceMin=20000 returns only products priced >= R20,000", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMin: "20000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.price.onceOff).toBeGreaterThanOrEqual(20000);
    }
  });

  it("priceMin=20000 returns exactly 2 products (iPhone 15 Pro + S24 Ultra)", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMin: "20000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(2);
  });

  it("priceMax=10000 returns only products priced <= R10,000", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMax: "10000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.price.onceOff).toBeLessThanOrEqual(10000);
    }
  });

  it("priceMax=10000 returns exactly 1 product (Samsung Galaxy A54 at R8,999)", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMax: "10000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(1);
    expect(body.catalog[0].price.onceOff).toBe(8999);
  });

  it("priceMin=15000&priceMax=20000 returns only products within the range", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMin: "15000", priceMax: "20000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.price.onceOff).toBeGreaterThanOrEqual(15000);
      expect(item.price.onceOff).toBeLessThanOrEqual(20000);
    }
  });

  it("priceMin=15000&priceMax=20000 returns exactly 3 products (iPhone 15, S24, iPhone 14)", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMin: "15000", priceMax: "20000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(3);
  });

  it("priceMin=99999 returns 0 products and an empty catalog array", async () => {
    const response = await GET(
      makeRequest("ZA", { priceMin: "99999" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(0);
    expect(body.catalog.length).toBe(0);
  });

  it("priceMin and priceMax together narrow more than each alone", async () => {
    const [rMin, rMax, rBoth] = await Promise.all([
      GET(makeRequest("ZA", { priceMin: "15000" }), makeParams("ZA")),
      GET(makeRequest("ZA", { priceMax: "20000" }), makeParams("ZA")),
      GET(makeRequest("ZA", { priceMin: "15000", priceMax: "20000" }), makeParams("ZA")),
    ]);
    const [bMin, bMax, bBoth] = await Promise.all([
      rMin.json(),
      rMax.json(),
      rBoth.json(),
    ]);
    expect(bBoth.pagination.totalItems).toBeLessThanOrEqual(
      bMin.pagination.totalItems
    );
    expect(bBoth.pagination.totalItems).toBeLessThanOrEqual(
      bMax.pagination.totalItems
    );
  });
});

// ── Storage filter ─────────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – storage filter", () => {
  it("storage=256 returns fewer products than unfiltered catalog", async () => {
    const [rAll, r256] = await Promise.all([
      GET(makeRequest("ZA"), makeParams("ZA")),
      GET(makeRequest("ZA", { storage: "256" }), makeParams("ZA")),
    ]);
    const [all, s256] = await Promise.all([rAll.json(), r256.json()]);
    expect(s256.pagination.totalItems).toBeLessThan(all.pagination.totalItems);
  });

  it("storage=256 returns exactly 3 products (iPhone 15 Pro, S24 Ultra, S24)", async () => {
    const response = await GET(
      makeRequest("ZA", { storage: "256" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(3);
  });

  it("storage=256 returned product names all contain '256'", async () => {
    const response = await GET(
      makeRequest("ZA", { storage: "256" }),
      makeParams("ZA")
    );
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item.name).toContain("256");
    }
  });

  it("storage=128 returns exactly 3 products (iPhone 15, A54, iPhone 14)", async () => {
    const response = await GET(
      makeRequest("ZA", { storage: "128" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(3);
  });

  it("storage=128 returned product names all contain '128'", async () => {
    const response = await GET(
      makeRequest("ZA", { storage: "128" }),
      makeParams("ZA")
    );
    const body = await response.json();
    for (const item of body.catalog) {
      expect(item.name).toContain("128");
    }
  });

  it("storage=128,256 (comma-separated) returns all 6 seeded products", async () => {
    const response = await GET(
      makeRequest("ZA", { storage: "128,256" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(6);
  });
});

// ── Availability filter ────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – availability filter", () => {
  it("availability=in-stock returns HTTP 200 without error", async () => {
    const response = await GET(
      makeRequest("ZA", { availability: "in-stock" }),
      makeParams("ZA")
    );
    expect(response.status).toBe(200);
  });

  it("availability=in-stock returns a non-empty catalog (all 6 seeded products are in-stock)", async () => {
    const response = await GET(
      makeRequest("ZA", { availability: "in-stock" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThanOrEqual(6);
    expect(body.pagination.totalItems).toBeGreaterThanOrEqual(6);
  });

  it("availability=pre-order returns HTTP 200 without error (may be empty)", async () => {
    const response = await GET(
      makeRequest("ZA", { availability: "pre-order" }),
      makeParams("ZA")
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("catalog");
    expect(Array.isArray(body.catalog)).toBe(true);
    expect(body).toHaveProperty("pagination");
  });
});

// ── Combined filters ───────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – combined filters", () => {
  it("brand=Apple&priceMax=19000 returns only Apple products priced <= R19,000", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple", priceMax: "19000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.name.toLowerCase()).not.toContain("samsung");
      expect(item.price.onceOff).toBeLessThanOrEqual(19000);
    }
  });

  it("brand=Apple&priceMax=19000 returns exactly 2 products (iPhone 15 + iPhone 14)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple", priceMax: "19000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(2);
  });

  it("brand=Apple&storage=128 returns only Apple 128GB products", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple", storage: "128" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.catalog.length).toBeGreaterThan(0);
    for (const item of body.catalog) {
      expect(item.name.toLowerCase()).not.toContain("samsung");
      expect(item.name).toContain("128");
    }
  });

  it("brand=Apple&storage=128 returns exactly 2 products (iPhone 15 128GB + iPhone 14 128GB)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Apple", storage: "128" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(2);
  });

  it("brand=Samsung&priceMin=20000 returns exactly 1 product (S24 Ultra at R22,999)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Samsung", priceMin: "20000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(1);
    expect(body.catalog[0].price.onceOff).toBe(22999);
  });

  it("brand=Samsung&storage=256&priceMax=18000 returns exactly 1 product (S24 at R16,999)", async () => {
    const response = await GET(
      makeRequest("ZA", { brand: "Samsung", storage: "256", priceMax: "18000" }),
      makeParams("ZA")
    );
    const body = await response.json();
    expect(body.pagination.totalItems).toBe(1);
    expect(body.catalog[0].price.onceOff).toBe(16999);
  });
});
