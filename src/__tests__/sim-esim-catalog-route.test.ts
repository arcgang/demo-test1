/**
 * Acceptance tests: GET /api/catalog?category=sim-esim&market={market}
 *
 * These tests MUST FAIL until the route handler is implemented at
 * src/app/api/catalog/route.ts and the SIM/eSIM seed data is in place.
 *
 * Covers (per task acceptance criteria and LLD §5.2):
 *   1. Endpoint exists and responds without throwing
 *   2. Returns 200 with an array of SIM/eSIM offers for market ZA
 *   3. Each offer carries the required simEsim data model fields:
 *        offerType, planIds, priceOnce, priceMonthly, currency,
 *        fulfilmentPath, marketAvailability
 *   4. offerType is "SIM" or "eSIM"
 *   5. fulfilmentPath is "PHYSICAL_DELIVERY" or "DIGITAL_ISSUANCE"
 *   6. currency matches the market's configured currency (ZAR for ZA)
 *   7. marketAvailability contains the requested market code
 *   8. At least 2 SIM offers and at least 2 eSIM offers are seeded for ZA
 *   9. planIds is a non-empty array of strings
 *  10. Unrecognised market code returns 404 with { error, message }
 *  11. Missing market query param returns 400
 *  12. category=sim-esim filter excludes non-SIM/eSIM product types
 *  13. Response wraps offers in a { offers } envelope
 *
 * Route handler is imported directly (Next.js App Router unit-test pattern).
 */

import { NextRequest } from "next/server";

// Module under test — does not exist yet; every test will fail with
// "Cannot find module" until the route is created.
import { GET } from "@/app/api/catalog/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): NextRequest {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/catalog?${qs}`);
}

// ── Endpoint reachability ─────────────────────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — reachability", () => {
  it("resolves without throwing for market ZA", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    await expect(GET(req)).resolves.toBeDefined();
  });

  it("returns HTTP 200 for market ZA", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns Content-Type application/json for market ZA", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});

// ── Response envelope shape ───────────────────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — response envelope", () => {
  it("response body has a top-level 'offers' array", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveProperty("offers");
    expect(Array.isArray(body.offers)).toBe(true);
  });

  it("offers array is non-empty for market ZA", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const { offers } = await res.json();
    expect(offers.length).toBeGreaterThan(0);
  });
});

// ── Per-offer field presence (data model completeness) ────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — offer field presence", () => {
  async function getOffers() {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const body = await res.json();
    return body.offers as Record<string, unknown>[];
  }

  it("every offer has an 'offerType' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("offerType"));
  });

  it("every offer has a 'planIds' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("planIds"));
  });

  it("every offer has a 'priceOnce' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("priceOnce"));
  });

  it("every offer has a 'priceMonthly' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("priceMonthly"));
  });

  it("every offer has a 'currency' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("currency"));
  });

  it("every offer has a 'fulfilmentPath' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("fulfilmentPath"));
  });

  it("every offer has a 'marketAvailability' field", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o).toHaveProperty("marketAvailability"));
  });
});

// ── Per-offer field value constraints ─────────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — offer field values", () => {
  async function getOffers() {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const body = await res.json();
    return body.offers as Record<string, unknown>[];
  }

  it("offerType is either 'SIM' or 'eSIM' for every offer", async () => {
    const offers = await getOffers();
    offers.forEach((o) =>
      expect(["SIM", "eSIM"]).toContain(o.offerType)
    );
  });

  it("fulfilmentPath is either 'PHYSICAL_DELIVERY' or 'DIGITAL_ISSUANCE' for every offer", async () => {
    const offers = await getOffers();
    offers.forEach((o) =>
      expect(["PHYSICAL_DELIVERY", "DIGITAL_ISSUANCE"]).toContain(
        o.fulfilmentPath
      )
    );
  });

  it("currency equals 'ZAR' for all ZA offers", async () => {
    const offers = await getOffers();
    offers.forEach((o) => expect(o.currency).toBe("ZAR"));
  });

  it("marketAvailability includes 'ZA' for every returned offer", async () => {
    const offers = await getOffers();
    offers.forEach((o) => {
      expect(Array.isArray(o.marketAvailability)).toBe(true);
      expect(o.marketAvailability as string[]).toContain("ZA");
    });
  });

  it("planIds is a non-empty array of strings for every offer", async () => {
    const offers = await getOffers();
    offers.forEach((o) => {
      expect(Array.isArray(o.planIds)).toBe(true);
      expect((o.planIds as unknown[]).length).toBeGreaterThan(0);
      (o.planIds as unknown[]).forEach((p) => expect(typeof p).toBe("string"));
    });
  });

  it("priceOnce is a non-negative number", async () => {
    const offers = await getOffers();
    offers.forEach((o) => {
      expect(typeof o.priceOnce).toBe("number");
      expect(o.priceOnce as number).toBeGreaterThanOrEqual(0);
    });
  });

  it("priceMonthly is a non-negative number", async () => {
    const offers = await getOffers();
    offers.forEach((o) => {
      expect(typeof o.priceMonthly).toBe("number");
      expect(o.priceMonthly as number).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Minimum seed count requirements ──────────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — seed data counts", () => {
  async function getOffers() {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const body = await res.json();
    return body.offers as Record<string, unknown>[];
  }

  it("returns at least 2 SIM offers for market ZA", async () => {
    const offers = await getOffers();
    const simOffers = offers.filter((o) => o.offerType === "SIM");
    expect(simOffers.length).toBeGreaterThanOrEqual(2);
  });

  it("returns at least 2 eSIM offers for market ZA", async () => {
    const offers = await getOffers();
    const esimOffers = offers.filter((o) => o.offerType === "eSIM");
    expect(esimOffers.length).toBeGreaterThanOrEqual(2);
  });
});

// ── SIM-specific fulfilmentPath constraint ────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — product-type fulfilment rules", () => {
  async function getOffers() {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const body = await res.json();
    return body.offers as Record<string, unknown>[];
  }

  it("SIM offers use PHYSICAL_DELIVERY as fulfilmentPath", async () => {
    const offers = await getOffers();
    const simOffers = offers.filter((o) => o.offerType === "SIM");
    simOffers.forEach((o) =>
      expect(o.fulfilmentPath).toBe("PHYSICAL_DELIVERY")
    );
  });

  it("eSIM offers use DIGITAL_ISSUANCE as fulfilmentPath", async () => {
    const offers = await getOffers();
    const esimOffers = offers.filter((o) => o.offerType === "eSIM");
    esimOffers.forEach((o) =>
      expect(o.fulfilmentPath).toBe("DIGITAL_ISSUANCE")
    );
  });
});

// ── Error handling — unrecognised market ──────────────────────────────────────

describe("GET /api/catalog?category=sim-esim&market=XX — unrecognised market", () => {
  it("returns HTTP 404 for unknown market code 'XX'", async () => {
    const req = makeRequest({ category: "sim-esim", market: "XX" });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("404 body has an 'error' field", async () => {
    const req = makeRequest({ category: "sim-esim", market: "XX" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("404 body has a non-empty 'message' string", async () => {
    const req = makeRequest({ category: "sim-esim", market: "XX" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect((body.message as string).trim().length).toBeGreaterThan(0);
  });

  it("404 body does not contain an 'offers' key", async () => {
    const req = makeRequest({ category: "sim-esim", market: "XX" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).not.toHaveProperty("offers");
  });

  it("never throws for any unrecognised market code", async () => {
    for (const code of ["INVALID", "123", "!@#", "undefined", "null"]) {
      const req = makeRequest({ category: "sim-esim", market: code });
      await expect(GET(req)).resolves.toBeDefined();
    }
  });
});

// ── Error handling — missing market query param ───────────────────────────────

describe("GET /api/catalog?category=sim-esim — missing market param", () => {
  it("returns HTTP 400 when market query param is absent", async () => {
    const req = makeRequest({ category: "sim-esim" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("400 body has an 'error' field", async () => {
    const req = makeRequest({ category: "sim-esim" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("400 body has a non-empty 'message' string", async () => {
    const req = makeRequest({ category: "sim-esim" });
    const res = await GET(req);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect((body.message as string).trim().length).toBeGreaterThan(0);
  });
});

// ── Category filter — only sim-esim offers returned ──────────────────────────

describe("GET /api/catalog?category=sim-esim&market=ZA — category filtering", () => {
  it("all returned offers have offerType SIM or eSIM (no non-SIM/eSIM items)", async () => {
    const req = makeRequest({ category: "sim-esim", market: "ZA" });
    const res = await GET(req);
    const { offers } = await res.json();
    (offers as Record<string, unknown>[]).forEach((o) =>
      expect(["SIM", "eSIM"]).toContain(o.offerType)
    );
  });
});
