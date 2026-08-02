/**
 * Acceptance tests: POST /api/onboarding/validate-configuration
 *
 * These tests MUST FAIL until the route handler is implemented at
 * src/app/api/onboarding/validate-configuration/route.ts.
 *
 * Covers (per task acceptance criteria and LLD §6.1 VAL-03):
 *   1. Endpoint exists and responds without throwing
 *   2. 200 { valid: true } when simEsimOfferId + planId are compatible
 *   3. 422 { valid: false, reason: string } when planId is not in the
 *      offer's planIds list (VAL-03 incompatible combination)
 *   4. 400 when request body is missing required fields
 *   5. 404 when simEsimOfferId does not reference a known offer
 *   6. reason field is a non-empty string on 422
 *   7. Response shape is exactly { valid: boolean } on 200 and
 *      { valid: false, reason: string } on 422
 *   8. An eSIM offer correctly validates its own planIds
 *   9. A SIM offer correctly validates its own planIds
 *  10. Matching is case-sensitive on planId
 *
 * Route handler is imported directly (Next.js App Router unit-test pattern).
 */

import { NextRequest } from "next/server";

// Module under test — does not exist yet; every test will fail with
// "Cannot find module" until the route is created.
import { POST } from "@/app/api/onboarding/validate-configuration/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    "http://localhost/api/onboarding/validate-configuration",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

// ── Reachability ──────────────────────────────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — reachability", () => {
  it("resolves without throwing for a valid ZA SIM offer + plan", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    await expect(POST(req)).resolves.toBeDefined();
  });

  it("returns Content-Type application/json", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});

// ── 200 compatible — SIM offer ────────────────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — 200 compatible (SIM)", () => {
  it("returns HTTP 200 for a compatible SIM offer + plan combination", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("response body contains { valid: true } for a compatible SIM pair", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ valid: true });
  });

  it("response body does NOT contain a 'reason' key on 200", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).not.toHaveProperty("reason");
  });
});

// ── 200 compatible — eSIM offer ───────────────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — 200 compatible (eSIM)", () => {
  it("returns HTTP 200 for a compatible eSIM offer + plan combination", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("response body contains { valid: true } for a compatible eSIM pair", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-standard",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ valid: true });
  });
});

// ── 422 incompatible — plan not in offer's planIds ────────────────────────────

describe("POST /api/onboarding/validate-configuration — 422 incompatible (VAL-03)", () => {
  it("returns HTTP 422 when planId is not in the SIM offer's planIds", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("response body has { valid: false } on 422", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("valid", false);
  });

  it("response body has a non-empty 'reason' string on 422", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("reason");
    expect(typeof body.reason).toBe("string");
    expect((body.reason as string).trim().length).toBeGreaterThan(0);
  });

  it("returns HTTP 422 when planId is not in the eSIM offer's planIds", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-standard",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("422 body has { valid: false, reason: string } for eSIM incompatible plan", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-standard",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(typeof body.reason).toBe("string");
    expect((body.reason as string).trim().length).toBeGreaterThan(0);
  });
});

// ── 404 — unknown simEsimOfferId ──────────────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — 404 unknown offer", () => {
  it("returns HTTP 404 for an offer ID that does not exist", async () => {
    const req = makeRequest({
      simEsimOfferId: "nonexistent-offer-id-9999",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("404 body has an 'error' field", async () => {
    const req = makeRequest({
      simEsimOfferId: "nonexistent-offer-id-9999",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("404 body has a non-empty 'message' string", async () => {
    const req = makeRequest({
      simEsimOfferId: "nonexistent-offer-id-9999",
      planId: "plan_unlimited_20gb",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect((body.message as string).trim().length).toBeGreaterThan(0);
  });

  it("never throws for any unrecognised offer ID", async () => {
    for (const id of ["INVALID", "123", "!@#", "", "undefined"]) {
      const req = makeRequest({ simEsimOfferId: id, planId: "plan_unlimited_20gb" });
      await expect(POST(req)).resolves.toBeDefined();
    }
  });
});

// ── 400 — missing required fields ────────────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — 400 missing fields", () => {
  it("returns HTTP 400 when request body is empty", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns HTTP 400 when simEsimOfferId is missing", async () => {
    const req = makeRequest({ planId: "plan_unlimited_20gb" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns HTTP 400 when planId is missing", async () => {
    const req = makeRequest({ simEsimOfferId: "sim-za-standard" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 body has an 'error' field", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("400 body has a non-empty 'message' string", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
    expect((body.message as string).trim().length).toBeGreaterThan(0);
  });
});

// ── Case-sensitivity on planId matching ───────────────────────────────────────

describe("POST /api/onboarding/validate-configuration — planId case sensitivity", () => {
  it("does not match planId with wrong casing (PLAN_UNLIMITED_20GB !== plan_unlimited_20gb)", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-standard",
      planId: "PLAN_UNLIMITED_20GB",
    });
    const res = await POST(req);
    // Uppercase variant must not validate as compatible
    expect(res.status).toBe(422);
  });
});

// ── Second seeded SIM offer validates correctly ───────────────────────────────

describe("POST /api/onboarding/validate-configuration — second seeded SIM offer", () => {
  it("returns 200 for a compatible plan on the second ZA SIM offer", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-red",
      planId: "plan_red_premium",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns { valid: true } for the second SIM offer's plan", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-red",
      planId: "plan_red_premium",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ valid: true });
  });

  it("returns 422 for an incompatible plan on the second ZA SIM offer", async () => {
    const req = makeRequest({
      simEsimOfferId: "sim-za-red",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});

// ── Second seeded eSIM offer validates correctly ──────────────────────────────

describe("POST /api/onboarding/validate-configuration — second seeded eSIM offer", () => {
  it("returns 200 for a compatible plan on the second ZA eSIM offer", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-premium",
      planId: "plan_red_premium",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns { valid: true } for the second eSIM offer's plan", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-premium",
      planId: "plan_red_premium",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ valid: true });
  });

  it("returns 422 for an incompatible plan on the second ZA eSIM offer", async () => {
    const req = makeRequest({
      simEsimOfferId: "esim-za-premium",
      planId: "plan_nonexistent_xyz",
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});
