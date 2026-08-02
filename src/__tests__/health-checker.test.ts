/**
 * Unit tests: HealthService, DependencyChecker interface, and individual
 * per-dependency checker classes (catalog, payment, eligibility, activation).
 *
 * These tests MUST FAIL until the following are created:
 *   src/lib/services/HealthService.ts
 *
 * Acceptance criteria covered here:
 *   - Each status object has: name, status (up/degraded/down), latencyMs, checkedAt
 *   - Each probe uses a 2 s configurable timeout
 *   - Checker returns status: "up" when the probe succeeds
 *   - Checker returns status: "down" when the probe throws or times out
 *   - HealthService.checkAll() aggregates results from all checkers
 *   - HealthService.isHealthy() is true iff every checker is "up"
 */

import {
  HealthService,
  GenericDependencyChecker,
  type CheckerOptions,
  type DependencyStatus,
  type DependencyChecker,
} from "@/lib/services/HealthService";

const CatalogDependencyChecker = (opts: CheckerOptions) => new GenericDependencyChecker("catalog", opts);
const PaymentDependencyChecker = (opts: CheckerOptions) => new GenericDependencyChecker("payment", opts);
const EligibilityDependencyChecker = (opts: CheckerOptions) => new GenericDependencyChecker("eligibility", opts);
const ActivationDependencyChecker = (opts: CheckerOptions) => new GenericDependencyChecker("activation", opts);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Probe that resolves immediately — simulates a healthy dependency. */
const succeedingProbe = (): Promise<void> => Promise.resolve();

/** Probe that rejects immediately — simulates a down dependency. */
const failingProbe = (): Promise<void> =>
  Promise.reject(new Error("connection refused"));

/** Probe that never resolves — simulates a hung dependency. */
const hangingProbe = (): Promise<void> => new Promise(() => undefined);

function isIsoTimestamp(s: string): boolean {
  return !isNaN(Date.parse(s)) && s.includes("T");
}

// ── DependencyStatus shape ────────────────────────────────────────────────────

describe("DependencyStatus – required field shapes", () => {
  it("name is a non-empty string", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(typeof result.name).toBe("string");
    expect(result.name.length).toBeGreaterThan(0);
  });

  it("status is one of up | degraded | down", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(["up", "degraded", "down"]).toContain(result.status);
  });

  it("latencyMs is a non-negative finite number", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(typeof result.latencyMs).toBe("number");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(isFinite(result.latencyMs)).toBe(true);
  });

  it("checkedAt is an ISO 8601 timestamp string", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(typeof result.checkedAt).toBe("string");
    expect(isIsoTimestamp(result.checkedAt)).toBe(true);
  });
});

// ── CatalogDependencyChecker ──────────────────────────────────────────────────

describe("CatalogDependencyChecker – up path", () => {
  it("reports name: 'catalog'", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.name).toBe("catalog");
  });

  it("reports status: 'up' when probe resolves", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });

  it("records a non-negative latencyMs", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("sets checkedAt to a recent ISO timestamp", async () => {
    const before = Date.now();
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    const after = Date.now();
    const ts = Date.parse(result.checkedAt);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after + 50);
  });
});

describe("CatalogDependencyChecker – down path", () => {
  it("reports status: 'down' when probe rejects", async () => {
    const checker = CatalogDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });

  it("still sets name: 'catalog' when down", async () => {
    const checker = CatalogDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(result.name).toBe("catalog");
  });

  it("still sets checkedAt when down", async () => {
    const checker = CatalogDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(isIsoTimestamp(result.checkedAt)).toBe(true);
  });

  it("never throws — check() always resolves", async () => {
    const checker = CatalogDependencyChecker({ probe: failingProbe });
    await expect(checker.check()).resolves.toBeDefined();
  });
});

describe("CatalogDependencyChecker – timeout", () => {
  it("reports status: 'down' when probe exceeds the configured timeout", async () => {
    const checker = CatalogDependencyChecker({
      probe: hangingProbe,
      timeoutMs: 50,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  }, 1000);

  it("default timeout is 2000 ms (passes fast probe within window)", async () => {
    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });
});

// ── PaymentDependencyChecker ──────────────────────────────────────────────────

describe("PaymentDependencyChecker – up path", () => {
  it("reports name: 'payment'", async () => {
    const checker = PaymentDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.name).toBe("payment");
  });

  it("reports status: 'up' when probe resolves", async () => {
    const checker = PaymentDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });
});

describe("PaymentDependencyChecker – down path", () => {
  it("reports status: 'down' when probe rejects", async () => {
    const checker = PaymentDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });

  it("never throws — check() always resolves", async () => {
    const checker = PaymentDependencyChecker({ probe: failingProbe });
    await expect(checker.check()).resolves.toBeDefined();
  });
});

describe("PaymentDependencyChecker – timeout", () => {
  it("reports status: 'down' when probe exceeds the configured timeout", async () => {
    const checker = PaymentDependencyChecker({
      probe: hangingProbe,
      timeoutMs: 50,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  }, 1000);
});

// ── EligibilityDependencyChecker ──────────────────────────────────────────────

describe("EligibilityDependencyChecker – up path", () => {
  it("reports name: 'eligibility'", async () => {
    const checker = EligibilityDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.name).toBe("eligibility");
  });

  it("reports status: 'up' when probe resolves", async () => {
    const checker = EligibilityDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });
});

describe("EligibilityDependencyChecker – down path", () => {
  it("reports status: 'down' when probe rejects", async () => {
    const checker = EligibilityDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });

  it("never throws — check() always resolves", async () => {
    const checker = EligibilityDependencyChecker({ probe: failingProbe });
    await expect(checker.check()).resolves.toBeDefined();
  });
});

describe("EligibilityDependencyChecker – timeout", () => {
  it("reports status: 'down' when probe exceeds the configured timeout", async () => {
    const checker = EligibilityDependencyChecker({
      probe: hangingProbe,
      timeoutMs: 50,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  }, 1000);
});

// ── ActivationDependencyChecker ───────────────────────────────────────────────

describe("ActivationDependencyChecker – up path", () => {
  it("reports name: 'activation'", async () => {
    const checker = ActivationDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.name).toBe("activation");
  });

  it("reports status: 'up' when probe resolves", async () => {
    const checker = ActivationDependencyChecker({ probe: succeedingProbe });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });
});

describe("ActivationDependencyChecker – down path", () => {
  it("reports status: 'down' when probe rejects", async () => {
    const checker = ActivationDependencyChecker({ probe: failingProbe });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });

  it("never throws — check() always resolves", async () => {
    const checker = ActivationDependencyChecker({ probe: failingProbe });
    await expect(checker.check()).resolves.toBeDefined();
  });
});

describe("ActivationDependencyChecker – timeout", () => {
  it("reports status: 'down' when probe exceeds the configured timeout", async () => {
    const checker = ActivationDependencyChecker({
      probe: hangingProbe,
      timeoutMs: 50,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  }, 1000);
});

// ── HealthService – checkAll ──────────────────────────────────────────────────

function makeUpChecker(name: string): DependencyChecker {
  return {
    name,
    check: async (): Promise<DependencyStatus> => ({
      name,
      status: "up",
      latencyMs: 5,
      checkedAt: new Date().toISOString(),
    }),
  };
}

function makeDownChecker(name: string): DependencyChecker {
  return {
    name,
    check: async (): Promise<DependencyStatus> => ({
      name,
      status: "down",
      latencyMs: 0,
      checkedAt: new Date().toISOString(),
    }),
  };
}

describe("HealthService.checkAll – all healthy", () => {
  it("returns one result per checker", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeUpChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    const results = await service.checkAll();
    expect(results).toHaveLength(4);
  });

  it("each result carries the checker name", async () => {
    const names = ["catalog", "payment", "eligibility", "activation"];
    const checkers = names.map(makeUpChecker);
    const service = new HealthService(checkers);
    const results = await service.checkAll();
    const returnedNames = results.map((r) => r.name);
    for (const name of names) {
      expect(returnedNames).toContain(name);
    }
  });

  it("all statuses are 'up' when all checkers succeed", async () => {
    const checkers = ["catalog", "payment", "eligibility", "activation"].map(
      makeUpChecker
    );
    const service = new HealthService(checkers);
    const results = await service.checkAll();
    for (const r of results) {
      expect(r.status).toBe("up");
    }
  });
});

describe("HealthService.checkAll – partial failure", () => {
  it("returns 'down' for the failing checker and 'up' for the rest", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeDownChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    const results = await service.checkAll();
    const byName = Object.fromEntries(results.map((r) => [r.name, r.status]));
    expect(byName["catalog"]).toBe("up");
    expect(byName["payment"]).toBe("down");
    expect(byName["eligibility"]).toBe("up");
    expect(byName["activation"]).toBe("up");
  });

  it("still returns all checkers' results even when one is down", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeDownChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    const results = await service.checkAll();
    expect(results).toHaveLength(4);
  });
});

describe("HealthService.checkAll – empty checker list", () => {
  it("returns an empty array when no checkers are registered", async () => {
    const service = new HealthService([]);
    const results = await service.checkAll();
    expect(results).toEqual([]);
  });
});

// ── HealthService – isHealthy ─────────────────────────────────────────────────

describe("HealthService.isHealthy", () => {
  it("returns true when all checkers are up", async () => {
    const checkers = ["catalog", "payment", "eligibility", "activation"].map(
      makeUpChecker
    );
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(true);
  });

  it("returns false when one checker is down", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeDownChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });

  it("returns false when all checkers are down", async () => {
    const checkers = ["catalog", "payment", "eligibility", "activation"].map(
      makeDownChecker
    );
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });

  it("returns true when checker list is empty (vacuously healthy)", async () => {
    const service = new HealthService([]);
    expect(await service.isHealthy()).toBe(true);
  });

  it("returns false when one checker is degraded and rest are up", async () => {
    const degradedChecker: DependencyChecker = {
      name: "payment",
      check: async (): Promise<DependencyStatus> => ({
        name: "payment",
        status: "degraded",
        latencyMs: 5,
        checkedAt: new Date().toISOString(),
      }),
    };
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      degradedChecker,
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });

  it("returns false when the last checker is down", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeUpChecker("payment"),
      makeUpChecker("eligibility"),
      makeDownChecker("activation"),
    ];
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });

  it("catalog down → not healthy", async () => {
    const checkers: DependencyChecker[] = [
      makeDownChecker("catalog"),
      makeUpChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });

  it("eligibility down → not healthy", async () => {
    const checkers: DependencyChecker[] = [
      makeUpChecker("catalog"),
      makeUpChecker("payment"),
      makeDownChecker("eligibility"),
      makeUpChecker("activation"),
    ];
    const service = new HealthService(checkers);
    expect(await service.isHealthy()).toBe(false);
  });
});

// ── CatalogDependencyChecker – degraded path ─────────────────────────────────

describe("CatalogDependencyChecker – degraded path", () => {
  it("reports status: 'degraded' when latency exceeds warnThresholdMs of 0", async () => {
    const checker = CatalogDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("degraded");
  });

  it("reports status: 'up' when latency is below warnThresholdMs", async () => {
    const checker = CatalogDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 10000,
    });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });

  it("warnThresholdMs does not affect the down path — down probe still reports 'down'", async () => {
    const checker = CatalogDependencyChecker({
      probe: failingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });
});

// ── PaymentDependencyChecker – degraded path ─────────────────────────────────

describe("PaymentDependencyChecker – degraded path", () => {
  it("reports status: 'degraded' when latency exceeds warnThresholdMs of 0", async () => {
    const checker = PaymentDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("degraded");
  });

  it("reports status: 'up' when latency is below warnThresholdMs", async () => {
    const checker = PaymentDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 10000,
    });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });

  it("warnThresholdMs does not affect the down path — down probe still reports 'down'", async () => {
    const checker = PaymentDependencyChecker({
      probe: failingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });
});

// ── EligibilityDependencyChecker – degraded path ──────────────────────────────

describe("EligibilityDependencyChecker – degraded path", () => {
  it("reports status: 'degraded' when latency exceeds warnThresholdMs of 0", async () => {
    const checker = EligibilityDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("degraded");
  });

  it("reports status: 'up' when latency is below warnThresholdMs", async () => {
    const checker = EligibilityDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 10000,
    });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });

  it("warnThresholdMs does not affect the down path — down probe still reports 'down'", async () => {
    const checker = EligibilityDependencyChecker({
      probe: failingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });
});

// ── ActivationDependencyChecker – degraded path ───────────────────────────────

describe("ActivationDependencyChecker – degraded path", () => {
  it("reports status: 'degraded' when latency exceeds warnThresholdMs of 0", async () => {
    const checker = ActivationDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("degraded");
  });

  it("reports status: 'up' when latency is below warnThresholdMs", async () => {
    const checker = ActivationDependencyChecker({
      probe: succeedingProbe,
      warnThresholdMs: 10000,
    });
    const result = await checker.check();
    expect(result.status).toBe("up");
  });

  it("warnThresholdMs does not affect the down path — down probe still reports 'down'", async () => {
    const checker = ActivationDependencyChecker({
      probe: failingProbe,
      warnThresholdMs: 0,
    });
    const result = await checker.check();
    expect(result.status).toBe("down");
  });
});

// ── Timer cleanup – no dangling timer on successful probe ─────────────────────

describe("runProbe – timer cleanup", () => {
  it("does not leave a dangling timer: setTimeout/clearTimeout calls are balanced", async () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const checker = CatalogDependencyChecker({ probe: succeedingProbe });
    await checker.check();

    const setCount = setTimeoutSpy.mock.calls.length;
    const clearCount = clearTimeoutSpy.mock.calls.length;
    expect(clearCount).toBeGreaterThanOrEqual(setCount);

    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});

// ── HealthService – checker isolation (state independence) ────────────────────

describe("HealthService – each instantiation is independent", () => {
  it("two HealthService instances with different checkers produce independent results", async () => {
    const allUp = new HealthService(
      ["catalog", "payment", "eligibility", "activation"].map(makeUpChecker)
    );
    const oneDown = new HealthService([
      makeUpChecker("catalog"),
      makeDownChecker("payment"),
      makeUpChecker("eligibility"),
      makeUpChecker("activation"),
    ]);

    expect(await allUp.isHealthy()).toBe(true);
    expect(await oneDown.isHealthy()).toBe(false);
  });
});
