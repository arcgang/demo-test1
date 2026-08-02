/**
 * Acceptance tests: GET /api/markets/{marketCode}/catalog?liteMode=true
 *
 * MUST FAIL until:
 *   1. CatalogService is created at src/lib/services/CatalogService.ts
 *   2. The route handler reads the ?liteMode query param and passes it to
 *      CatalogService.getCatalog so that catalog items in the response
 *      reflect full vs. lite shapes.
 *
 * Covers (LLD §5.2 task acceptance criteria):
 *   – ?liteMode=true → catalog items OMIT imageUrl, promoVideoUrl, alternateImages
 *   – ?liteMode=true → catalog items RETAIN productId, name, price, badges,
 *                       availabilityStatus, href
 *   – no liteMode param (default) → catalog items INCLUDE media fields
 *   – ?liteMode=false → same as default (media fields present)
 *   – market object shape is unaffected by liteMode
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/markets/[marketCode]/catalog/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeParams(marketCode: string): { params: { marketCode: string } } {
  return { params: { marketCode } };
}

// ── Default payload includes media fields ─────────────────────────────────────

describe("GET /api/markets/ZA/catalog – default (no liteMode) catalog items", () => {
  it("returns HTTP 200", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    expect(response.status).toBe(200);
  });

  it("catalog array is present in the response body", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    const body = await response.json();

    expect(body).toHaveProperty("catalog");
    expect(Array.isArray(body.catalog)).toBe(true);
  });

  it("catalog contains at least one item for ZA", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
  });

  it("default catalog items include imageUrl", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("imageUrl");
    }
  });

  it("default catalog items include promoVideoUrl key", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(Object.prototype.hasOwnProperty.call(item, "promoVideoUrl")).toBe(true);
    }
  });

  it("default catalog items include alternateImages", async () => {
    const req = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("alternateImages");
    }
  });
});

// ── liteMode=true omits media fields ─────────────────────────────────────────

describe("GET /api/markets/ZA/catalog?liteMode=true – lite payload", () => {
  it("returns HTTP 200", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    expect(response.status).toBe(200);
  });

  it("catalog array is present in the lite response", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const body = await response.json();

    expect(body).toHaveProperty("catalog");
    expect(Array.isArray(body.catalog)).toBe(true);
  });

  it("lite ZA catalog contains at least one item", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
  });

  it("lite catalog items OMIT imageUrl", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).not.toHaveProperty("imageUrl");
    }
  });

  it("lite catalog items OMIT promoVideoUrl", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).not.toHaveProperty("promoVideoUrl");
    }
  });

  it("lite catalog items OMIT alternateImages", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).not.toHaveProperty("alternateImages");
    }
  });

  it("lite catalog items RETAIN productId", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("productId");
      expect(typeof item.productId).toBe("string");
    }
  });

  it("lite catalog items RETAIN name", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("name");
      expect(typeof item.name).toBe("string");
    }
  });

  it("lite catalog items RETAIN price with onceOff and currency", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("price");
      expect(item.price).toHaveProperty("onceOff");
      expect(item.price).toHaveProperty("currency");
    }
  });

  it("lite catalog items RETAIN badges array", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("badges");
      expect(Array.isArray(item.badges)).toBe(true);
    }
  });

  it("lite catalog items RETAIN availabilityStatus", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("availabilityStatus");
    }
  });

  it("lite catalog items RETAIN href (View Details link)", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("href");
      expect(typeof item.href).toBe("string");
    }
  });

  it("market object in lite response is unchanged vs. default", async () => {
    const defaultReq = new NextRequest("http://localhost/api/markets/ZA/catalog");
    const liteReq = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );

    const [defaultRes, liteRes] = await Promise.all([
      GET(defaultReq, makeParams("ZA")),
      GET(liteReq, makeParams("ZA")),
    ]);

    const { market: defaultMarket } = await defaultRes.json();
    const { market: liteMarket } = await liteRes.json();

    expect(liteMarket).toEqual(defaultMarket);
  });
});

// ── liteMode=false identical to default ──────────────────────────────────────

describe("GET /api/markets/ZA/catalog?liteMode=false – same as default", () => {
  it("catalog contains at least one item when liteMode=false", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=false"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
  });

  it("catalog items have imageUrl when liteMode=false", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=false"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).toHaveProperty("imageUrl");
    }
  });

  it("catalog items have promoVideoUrl key when liteMode=false", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=false"
    );
    const response = await GET(req, makeParams("ZA"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(Object.prototype.hasOwnProperty.call(item, "promoVideoUrl")).toBe(true);
    }
  });
});

// ── liteMode consistent across markets ───────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog?liteMode=true – cross-market", () => {
  it("liteMode=true is accepted for TZ (HTTP 200)", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/TZ/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("TZ"));
    expect(response.status).toBe(200);
  });

  it("TZ catalog contains at least one item with liteMode=true", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/TZ/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("TZ"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
  });

  it("TZ lite catalog items also omit imageUrl", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/TZ/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("TZ"));
    const { catalog } = await response.json();

    expect(catalog.length).toBeGreaterThan(0);
    for (const item of catalog) {
      expect(item).not.toHaveProperty("imageUrl");
    }
  });

  it("liteMode=true is accepted for EG (HTTP 200)", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/EG/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("EG"));
    expect(response.status).toBe(200);
  });

  it("liteMode=true with unknown market code still returns 404", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/XX/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("XX"));
    expect(response.status).toBe(404);
  });
});
