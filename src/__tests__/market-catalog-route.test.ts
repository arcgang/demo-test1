/**
 * Acceptance tests: GET /api/markets/{marketCode}/catalog
 *
 * These tests MUST FAIL until the route handler is implemented at
 * src/app/api/markets/[marketCode]/catalog/route.ts
 *
 * Covers (per LLD §5.2 and the task acceptance criteria):
 *   1. Valid market code → 200 with correct response shape
 *   2. Unrecognised market code → 404 with structured { error, message } body
 *   3. Response object fields: marketCode, currency, locale, taxLabel,
 *      enabledPaymentMethods
 *   4. enabledPaymentMethods reflects market-specific configuration
 *   5. Never returns a blank page or unhandled exception for bad input
 *
 * The route handler is tested via Next.js route-handler unit test pattern:
 * import the exported GET function directly and call it with a mocked Request.
 */

import { NextRequest } from "next/server";

// Module under test — does not exist yet; every test will fail with
// "Cannot find module" until the route handler is created.
import { GET } from "@/app/api/markets/[marketCode]/catalog/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(marketCode: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/markets/${marketCode}/catalog`
  );
}

function makeParams(marketCode: string): { params: { marketCode: string } } {
  return { params: { marketCode } };
}

// ── 200 – valid market ────────────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – 200 valid market", () => {
  it("returns HTTP 200 for market code ZA", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    expect(response.status).toBe(200);
  });

  it("returns HTTP 200 for market code TZ", async () => {
    const response = await GET(makeRequest("TZ"), makeParams("TZ"));
    expect(response.status).toBe(200);
  });

  it("returns HTTP 200 for market code EG", async () => {
    const response = await GET(makeRequest("EG"), makeParams("EG"));
    expect(response.status).toBe(200);
  });

  it("response body is valid JSON", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    let parsed: unknown;
    expect(() => {
      parsed = response.json();
    }).not.toThrow();
    await expect(response.json()).resolves.not.toBeNull();
  });

  it("response Content-Type is application/json", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const contentType = response.headers.get("content-type") ?? "";
    expect(contentType).toContain("application/json");
  });
});

// ── Response shape (LLD §5.2) ─────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – response shape", () => {
  it("top-level response contains a 'market' object", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body).toHaveProperty("market");
    expect(typeof body.market).toBe("object");
  });

  it("market object has 'marketCode' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market).toHaveProperty("marketCode");
  });

  it("market object has 'currency' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market).toHaveProperty("currency");
  });

  it("market object has 'locale' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market).toHaveProperty("locale");
  });

  it("market object has 'taxLabel' field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market).toHaveProperty("taxLabel");
  });

  it("market object has 'enabledPaymentMethods' array field", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market).toHaveProperty("enabledPaymentMethods");
    expect(Array.isArray(market.enabledPaymentMethods)).toBe(true);
  });

  it("top-level response contains a 'catalog' array", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const body = await response.json();
    expect(body).toHaveProperty("catalog");
    expect(Array.isArray(body.catalog)).toBe(true);
  });
});

// ── Market-specific field values ──────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – ZA field values", () => {
  it("market.marketCode equals 'ZA'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market.marketCode).toBe("ZA");
  });

  it("market.currency equals 'ZAR'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market.currency).toBe("ZAR");
  });

  it("market.locale equals 'en-ZA'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market.locale).toBe("en-ZA");
  });

  it("market.taxLabel contains 'VAT' and '15'", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market.taxLabel.toUpperCase()).toContain("VAT");
    expect(market.taxLabel).toContain("15");
  });

  it("ZA enabledPaymentMethods includes both CARD_TOKEN and MOBILE_MONEY", async () => {
    const response = await GET(makeRequest("ZA"), makeParams("ZA"));
    const { market } = await response.json();
    expect(market.enabledPaymentMethods).toContain("CARD_TOKEN");
    expect(market.enabledPaymentMethods).toContain("MOBILE_MONEY");
  });
});

describe("GET /api/markets/:marketCode/catalog – TZ field values", () => {
  it("market.currency equals 'TZS'", async () => {
    const response = await GET(makeRequest("TZ"), makeParams("TZ"));
    const { market } = await response.json();
    expect(market.currency).toBe("TZS");
  });

  it("market.locale equals 'sw-TZ'", async () => {
    const response = await GET(makeRequest("TZ"), makeParams("TZ"));
    const { market } = await response.json();
    expect(market.locale).toBe("sw-TZ");
  });

  it("TZ enabledPaymentMethods includes MOBILE_MONEY and excludes CARD_TOKEN", async () => {
    const response = await GET(makeRequest("TZ"), makeParams("TZ"));
    const { market } = await response.json();
    expect(market.enabledPaymentMethods).toContain("MOBILE_MONEY");
    expect(market.enabledPaymentMethods).not.toContain("CARD_TOKEN");
  });
});

describe("GET /api/markets/:marketCode/catalog – EG field values", () => {
  it("market.currency equals 'EGP'", async () => {
    const response = await GET(makeRequest("EG"), makeParams("EG"));
    const { market } = await response.json();
    expect(market.currency).toBe("EGP");
  });

  it("market.locale equals 'ar-EG'", async () => {
    const response = await GET(makeRequest("EG"), makeParams("EG"));
    const { market } = await response.json();
    expect(market.locale).toBe("ar-EG");
  });

  it("EG enabledPaymentMethods includes CARD_TOKEN and excludes MOBILE_MONEY", async () => {
    const response = await GET(makeRequest("EG"), makeParams("EG"));
    const { market } = await response.json();
    expect(market.enabledPaymentMethods).toContain("CARD_TOKEN");
    expect(market.enabledPaymentMethods).not.toContain("MOBILE_MONEY");
  });
});

// ── 404 – unrecognised market code ────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – 404 unrecognised market", () => {
  it("returns HTTP 404 for unrecognised code 'XX'", async () => {
    const response = await GET(makeRequest("XX"), makeParams("XX"));
    expect(response.status).toBe(404);
  });

  it("returns HTTP 404 for empty string market code", async () => {
    const response = await GET(makeRequest(""), makeParams(""));
    expect(response.status).toBe(404);
  });

  it("returns HTTP 404 for lowercase known code 'za' (codes are uppercase)", async () => {
    const response = await GET(makeRequest("za"), makeParams("za"));
    expect(response.status).toBe(404);
  });

  it("404 response body is valid JSON (never a blank page)", async () => {
    const response = await GET(makeRequest("XX"), makeParams("XX"));
    await expect(response.json()).resolves.not.toBeNull();
  });

  it("404 body has an 'error' field (structured error envelope)", async () => {
    const response = await GET(makeRequest("XX"), makeParams("XX"));
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("404 body has a 'message' field describing the problem", async () => {
    const response = await GET(makeRequest("XX"), makeParams("XX"));
    const body = await response.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect(body.message.trim().length).toBeGreaterThan(0);
  });

  it("404 body does NOT contain a 'market' key (no partial data leak)", async () => {
    const response = await GET(makeRequest("XX"), makeParams("XX"));
    const body = await response.json();
    expect(body).not.toHaveProperty("market");
  });

  it("never throws an unhandled exception for any unknown market code", async () => {
    const codes = ["INVALID", "123", "!@#", "undefined", "null"];
    for (const code of codes) {
      await expect(
        GET(makeRequest(code), makeParams(code))
      ).resolves.toBeDefined();
    }
  });
});

// ── Query parameter passthrough ────────────────────────────────────────────────

describe("GET /api/markets/:marketCode/catalog – query parameter handling", () => {
  it("accepts optional 'category' query param without error", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?category=devices"
    );
    const response = await GET(req, makeParams("ZA"));
    expect(response.status).toBe(200);
  });

  it("accepts optional 'liteMode=true' query param without error", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?liteMode=true"
    );
    const response = await GET(req, makeParams("ZA"));
    expect(response.status).toBe(200);
  });

  it("accepts optional 'locale' override query param without error", async () => {
    const req = new NextRequest(
      "http://localhost/api/markets/ZA/catalog?locale=af-ZA"
    );
    const response = await GET(req, makeParams("ZA"));
    expect(response.status).toBe(200);
  });
});
