/**
 * Integration tests: GET /api/health and GET /api/health/dependencies
 *
 * These tests MUST FAIL until:
 *   src/app/api/health/route.ts                  — aggregate health endpoint
 *   src/app/api/health/dependencies/route.ts     — per-dependency detail endpoint
 *   src/lib/services/HealthService.ts            — HealthService and checkers
 *
 * Acceptance criteria covered:
 *   - GET /api/health → 200 when all adapters up, 503 when any is down
 *   - GET /api/health/dependencies → 200 with array of DependencyStatus objects
 *   - 503 when any dependency is down on /api/health/dependencies
 *   - Response shape: { status, checkedAt, dependencies[] } on /api/health
 *   - Per-dependency shape: { name, status, latencyMs, checkedAt }
 *   - All four dependency names present: catalog, payment, eligibility, activation
 *   - Simulated adapter failure flips aggregate to 503 within 60 s
 */

import { NextRequest } from "next/server";

// These imports will fail (Cannot find module) until the routes are created.
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getDependencies } from "@/app/api/health/dependencies/route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

function isIsoTimestamp(s: string): boolean {
  return !isNaN(Date.parse(s)) && s.includes("T");
}

// ── GET /api/health – normal (mock-mode / all up) ─────────────────────────────

describe("GET /api/health – aggregate status (all up)", () => {
  it("returns HTTP 200 when all dependencies are up", async () => {
    const response = await getHealth(makeReq("/api/health"));
    // In mock/in-process mode every checker should resolve to 'up'
    expect(response.status).toBe(200);
  });

  it("response Content-Type is application/json", async () => {
    const response = await getHealth(makeReq("/api/health"));
    expect(response.headers.get("content-type") ?? "").toContain(
      "application/json"
    );
  });

  it("body has top-level 'status' field", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    expect(body).toHaveProperty("status");
  });

  it("top-level status is 'up' when all are healthy", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    expect(body.status).toBe("up");
  });

  it("body has a 'checkedAt' ISO timestamp", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    expect(body).toHaveProperty("checkedAt");
    expect(isIsoTimestamp(body.checkedAt)).toBe(true);
  });

  it("body has a 'dependencies' array", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    expect(body).toHaveProperty("dependencies");
    expect(Array.isArray(body.dependencies)).toBe(true);
  });

  it("dependencies array has exactly four entries", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    expect(body.dependencies).toHaveLength(4);
  });

  it("dependency names are catalog, payment, eligibility, activation", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    const names = body.dependencies.map((d: { name: string }) => d.name);
    expect(names).toContain("catalog");
    expect(names).toContain("payment");
    expect(names).toContain("eligibility");
    expect(names).toContain("activation");
  });

  it("each dependency item has name, status, latencyMs, checkedAt", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    for (const dep of body.dependencies) {
      expect(dep).toHaveProperty("name");
      expect(dep).toHaveProperty("status");
      expect(dep).toHaveProperty("latencyMs");
      expect(dep).toHaveProperty("checkedAt");
    }
  });

  it("each dependency status is one of up | degraded | down", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    for (const dep of body.dependencies) {
      expect(["up", "degraded", "down"]).toContain(dep.status);
    }
  });

  it("each dependency latencyMs is a non-negative number", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    for (const dep of body.dependencies) {
      expect(typeof dep.latencyMs).toBe("number");
      expect(dep.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("each dependency checkedAt is an ISO timestamp", async () => {
    const response = await getHealth(makeReq("/api/health"));
    const body = await response.json();
    for (const dep of body.dependencies) {
      expect(isIsoTimestamp(dep.checkedAt)).toBe(true);
    }
  });
});

// ── GET /api/health/dependencies – per-dependency detail ─────────────────────

describe("GET /api/health/dependencies – detail endpoint (all up)", () => {
  it("returns HTTP 200 when all dependencies are up", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    expect(response.status).toBe(200);
  });

  it("response Content-Type is application/json", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    expect(response.headers.get("content-type") ?? "").toContain(
      "application/json"
    );
  });

  it("body is an array", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("array has exactly four entries", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    const body = await response.json();
    expect(body).toHaveLength(4);
  });

  it("each entry has name, status, latencyMs, checkedAt", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    const body = await response.json();
    for (const dep of body) {
      expect(dep).toHaveProperty("name");
      expect(dep).toHaveProperty("status");
      expect(dep).toHaveProperty("latencyMs");
      expect(dep).toHaveProperty("checkedAt");
    }
  });

  it("all four dependency names are present", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    const body = await response.json();
    const names = body.map((d: { name: string }) => d.name);
    expect(names).toContain("catalog");
    expect(names).toContain("payment");
    expect(names).toContain("eligibility");
    expect(names).toContain("activation");
  });

  it("each status value is one of up | degraded | down", async () => {
    const response = await getDependencies(makeReq("/api/health/dependencies"));
    const body = await response.json();
    for (const dep of body) {
      expect(["up", "degraded", "down"]).toContain(dep.status);
    }
  });
});

// ── 503 when any dependency is down ──────────────────────────────────────────
//
// The routes must accept an optional override map so tests can inject a
// failing checker without modifying global module state.
// The override is passed as an X-Health-Probe-Override header whose value is
// a JSON object: { [depName]: "down" | "up" | "degraded" }.
// If the header is absent the route uses its normal checkers.
//
// This header-based injection pattern keeps the routes themselves testable in
// isolation without requiring module-level mocking or dependency-injection
// parameters in the route function signatures.

describe("GET /api/health – 503 when a dependency is down", () => {
  function makeOverrideReq(
    path: string,
    overrides: Record<string, string>
  ): NextRequest {
    return new NextRequest(`http://localhost${path}`, {
      headers: { "x-health-probe-override": JSON.stringify(overrides) },
    });
  }

  it("returns HTTP 503 when catalog is overridden to down", async () => {
    const req = makeOverrideReq("/api/health", { catalog: "down" });
    const response = await getHealth(req);
    expect(response.status).toBe(503);
  });

  it("returns HTTP 503 when payment is overridden to down", async () => {
    const req = makeOverrideReq("/api/health", { payment: "down" });
    const response = await getHealth(req);
    expect(response.status).toBe(503);
  });

  it("returns HTTP 503 when eligibility is overridden to down", async () => {
    const req = makeOverrideReq("/api/health", { eligibility: "down" });
    const response = await getHealth(req);
    expect(response.status).toBe(503);
  });

  it("returns HTTP 503 when activation is overridden to down", async () => {
    const req = makeOverrideReq("/api/health", { activation: "down" });
    const response = await getHealth(req);
    expect(response.status).toBe(503);
  });

  it("aggregate body status is 'down' when any dep is down", async () => {
    const req = makeOverrideReq("/api/health", { payment: "down" });
    const response = await getHealth(req);
    const body = await response.json();
    expect(body.status).toBe("down");
  });

  it("still returns all four dependency entries when one is down", async () => {
    const req = makeOverrideReq("/api/health", { catalog: "down" });
    const response = await getHealth(req);
    const body = await response.json();
    expect(body.dependencies).toHaveLength(4);
  });

  it("the down dependency appears in the response with status 'down'", async () => {
    const req = makeOverrideReq("/api/health", { eligibility: "down" });
    const response = await getHealth(req);
    const body = await response.json();
    const dep = body.dependencies.find(
      (d: { name: string }) => d.name === "eligibility"
    );
    expect(dep).toBeDefined();
    expect(dep.status).toBe("down");
  });

  it("returns HTTP 503 when all four are overridden to down", async () => {
    const req = makeOverrideReq("/api/health", {
      catalog: "down",
      payment: "down",
      eligibility: "down",
      activation: "down",
    });
    const response = await getHealth(req);
    expect(response.status).toBe(503);
  });
});

describe("GET /api/health/dependencies – 503 when a dependency is down", () => {
  function makeOverrideReq(
    path: string,
    overrides: Record<string, string>
  ): NextRequest {
    return new NextRequest(`http://localhost${path}`, {
      headers: { "x-health-probe-override": JSON.stringify(overrides) },
    });
  }

  it("returns HTTP 503 when catalog is overridden to down", async () => {
    const req = makeOverrideReq("/api/health/dependencies", { catalog: "down" });
    const response = await getDependencies(req);
    expect(response.status).toBe(503);
  });

  it("returns HTTP 503 when any dependency is overridden to down", async () => {
    for (const dep of ["payment", "eligibility", "activation"]) {
      const req = makeOverrideReq("/api/health/dependencies", { [dep]: "down" });
      const response = await getDependencies(req);
      expect(response.status).toBe(503);
    }
  });

  it("still returns all entries in the array body even on 503", async () => {
    const req = makeOverrideReq("/api/health/dependencies", { payment: "down" });
    const response = await getDependencies(req);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);
  });
});

// ── Operator SLA: assessable within 60 s ─────────────────────────────────────

describe("GET /api/health – latency SLA (assessable within 60 s)", () => {
  it("responds in under 3000 ms under normal conditions", async () => {
    const start = Date.now();
    await getHealth(makeReq("/api/health"));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  }, 5000);

  it("responds in under 3000 ms on /dependencies under normal conditions", async () => {
    const start = Date.now();
    await getDependencies(makeReq("/api/health/dependencies"));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  }, 5000);
});
