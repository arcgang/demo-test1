/**
 * Acceptance tests: CatalogService in-process TTL cache
 *
 * These tests MUST FAIL until the caching layer is implemented in
 * @/lib/services/CatalogService.
 *
 * Acceptance criteria verified here:
 *   1. Loading the Smartphones category twice in quick succession produces
 *      only ONE downstream catalog-adapter call (second request is a cache hit).
 *   2. Cache expires after the configured 60-second TTL — a call after expiry
 *      triggers a fresh adapter call.
 *   3. TTL is tunable via the CATALOG_FRAGMENT_TTL_MS environment variable.
 *   4. Cache is keyed by (marketCode, category) — a hit for ZA/smartphones
 *      does not suppress an adapter call for ZA/tablets or TZ/smartphones.
 *   5. Structured logs record a cache-hit marker on the second request so
 *      operators can confirm in logs that the adapter was not called.
 */

import {
  CatalogService,
  type CatalogAdapter,
  type CatalogFragment,
  type CatalogLogger,
} from "@/lib/services/CatalogService";

// ── Fixtures ───────────────────────────────────────────────────────────────────

const SMARTPHONES_ZA: CatalogFragment = {
  category: "smartphones",
  marketCode: "ZA",
  products: [
    { id: "p1", name: "Galaxy S24", priceOnceOff: 1299900 },
    { id: "p2", name: "iPhone 15", priceOnceOff: 1599900 },
  ],
};

const TABLETS_ZA: CatalogFragment = {
  category: "tablets",
  marketCode: "ZA",
  products: [{ id: "p3", name: "iPad Air", priceOnceOff: 999900 }],
};

const SMARTPHONES_TZ: CatalogFragment = {
  category: "smartphones",
  marketCode: "TZ",
  products: [{ id: "p4", name: "Tecno Spark", priceOnceOff: 450000 }],
};

function makeMockAdapter(
  fragments: CatalogFragment[]
): jest.Mocked<CatalogAdapter> {
  return {
    fetchByCategory: jest.fn(
      (marketCode: string, category: string): Promise<CatalogFragment> => {
        const match = fragments.find(
          (f) => f.marketCode === marketCode && f.category === category
        );
        if (!match) {
          return Promise.resolve({ category, marketCode, products: [] });
        }
        return Promise.resolve(match);
      }
    ),
  };
}

function makeMockLogger(): jest.Mocked<CatalogLogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// ── Cache hit — second call skips adapter ──────────────────────────────────────

describe("CatalogService cache – hit on second Smartphones call", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
  });

  it("calls adapter.fetchByCategory only once for two back-to-back Smartphones requests", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones");

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(1);
  });

  it("returns the same CatalogFragment on the second call (served from cache)", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    const first = await service.getCatalogFragment("ZA", "smartphones");
    const second = await service.getCatalogFragment("ZA", "smartphones");

    expect(second).toEqual(first);
    expect(second.products.length).toBe(2);
  });

  it("three consecutive calls produce only one adapter call", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones");

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(1);
  });
});

// ── Cache keyed by (marketCode, category) ────────────────────────────────────

describe("CatalogService cache – per (marketCode, category) keying", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
  });

  it("a ZA/smartphones cache hit does not suppress a ZA/tablets adapter call", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA, TABLETS_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones"); // cache hit
    await service.getCatalogFragment("ZA", "tablets"); // different category — should call adapter

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(2);
    expect(adapter.fetchByCategory).toHaveBeenCalledWith("ZA", "smartphones");
    expect(adapter.fetchByCategory).toHaveBeenCalledWith("ZA", "tablets");
  });

  it("a ZA/smartphones cache hit does not suppress a TZ/smartphones adapter call", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA, SMARTPHONES_TZ]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones"); // cache hit
    await service.getCatalogFragment("TZ", "smartphones"); // different market — should call adapter

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(2);
    expect(adapter.fetchByCategory).toHaveBeenCalledWith("ZA", "smartphones");
    expect(adapter.fetchByCategory).toHaveBeenCalledWith("TZ", "smartphones");
  });

  it("each unique (marketCode, category) pair is independently cached", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA, TABLETS_ZA, SMARTPHONES_TZ]);
    const service = new CatalogService(adapter);

    // Prime three keys
    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "tablets");
    await service.getCatalogFragment("TZ", "smartphones");

    // Call all three again — all should be cache hits
    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "tablets");
    await service.getCatalogFragment("TZ", "smartphones");

    // Adapter called once per unique key
    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(3);
  });
});

// ── TTL expiry — 60-second default ───────────────────────────────────────────

describe("CatalogService cache – TTL expiry (default 60 s)", () => {
  const DEFAULT_TTL_MS = 60 * 1000;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
  });

  it("calls adapter again after the default 60-second TTL has elapsed", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones"); // prime cache
    jest.advanceTimersByTime(DEFAULT_TTL_MS + 1);
    await service.getCatalogFragment("ZA", "smartphones"); // TTL expired → adapter call

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(2);
  });

  it("does NOT call adapter again when 60-second TTL has not yet elapsed", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    jest.advanceTimersByTime(DEFAULT_TTL_MS - 1000); // 1 second before expiry
    await service.getCatalogFragment("ZA", "smartphones");

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(1);
  });

  it("returns fresh data from adapter after TTL expiry", async () => {
    const adapter: jest.Mocked<CatalogAdapter> = {
      fetchByCategory: jest.fn().mockResolvedValue(SMARTPHONES_ZA),
    };
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");

    const updatedFragment: CatalogFragment = {
      ...SMARTPHONES_ZA,
      products: [{ id: "p99", name: "New Model", priceOnceOff: 9999900 }],
    };
    (adapter.fetchByCategory as jest.Mock).mockResolvedValue(updatedFragment);

    jest.advanceTimersByTime(DEFAULT_TTL_MS + 1);
    const fresh = await service.getCatalogFragment("ZA", "smartphones");

    expect(fresh.products[0]?.id).toBe("p99");
  });
});

// ── Tunable TTL via environment variable ────────────────────────────────────────

describe("CatalogService cache – CATALOG_FRAGMENT_TTL_MS env var", () => {
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
  });

  it("respects a custom TTL of 500 ms set via CATALOG_FRAGMENT_TTL_MS", async () => {
    process.env["CATALOG_FRAGMENT_TTL_MS"] = "500";
    jest.useFakeTimers();

    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    jest.advanceTimersByTime(300); // still within 500 ms TTL
    await service.getCatalogFragment("ZA", "smartphones"); // cache hit

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(201); // now past 500 ms total
    await service.getCatalogFragment("ZA", "smartphones"); // miss

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(2);
  });

  it("uses the default 60-second TTL when CATALOG_FRAGMENT_TTL_MS is not set", async () => {
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
    jest.useFakeTimers();

    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const service = new CatalogService(adapter);

    await service.getCatalogFragment("ZA", "smartphones");
    jest.advanceTimersByTime(59 * 1000); // 59 seconds — still cached
    await service.getCatalogFragment("ZA", "smartphones");

    expect(adapter.fetchByCategory).toHaveBeenCalledTimes(1);
  });
});

// ── Structured log — cache-hit marker ─────────────────────────────────────────

describe("CatalogService cache – structured log on cache hit", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["CATALOG_FRAGMENT_TTL_MS"];
  });

  it("logs a cache-hit entry on the second request (not on the first)", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const logger = makeMockLogger();
    const service = new CatalogService(adapter, logger);

    await service.getCatalogFragment("ZA", "smartphones"); // miss — no cache-hit log
    await service.getCatalogFragment("ZA", "smartphones"); // hit — must log

    const allInfoCalls: string[] = (logger.info as jest.Mock).mock.calls.map(
      (args: unknown[]) => JSON.stringify(args)
    );
    const hitLogFound = allInfoCalls.some((entry) =>
      entry.toLowerCase().includes("cache") &&
      (entry.toLowerCase().includes("hit") || entry.toLowerCase().includes("cached"))
    );
    expect(hitLogFound).toBe(true);
  });

  it("cache-hit log entry contains the marketCode and category", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const logger = makeMockLogger();
    const service = new CatalogService(adapter, logger);

    await service.getCatalogFragment("ZA", "smartphones");
    await service.getCatalogFragment("ZA", "smartphones");

    const allInfoCalls: string[] = (logger.info as jest.Mock).mock.calls.map(
      (args: unknown[]) => JSON.stringify(args)
    );
    const hitEntry = allInfoCalls.find((entry) =>
      entry.toLowerCase().includes("cache") &&
      (entry.toLowerCase().includes("hit") || entry.toLowerCase().includes("cached"))
    );
    expect(hitEntry).toBeDefined();
    expect(hitEntry).toContain("ZA");
    expect(hitEntry).toContain("smartphones");
  });

  it("does NOT log a cache-hit entry on the first (miss) request", async () => {
    const adapter = makeMockAdapter([SMARTPHONES_ZA]);
    const logger = makeMockLogger();
    const service = new CatalogService(adapter, logger);

    await service.getCatalogFragment("ZA", "smartphones"); // first call — no hit yet

    const allInfoCalls: string[] = (logger.info as jest.Mock).mock.calls.map(
      (args: unknown[]) => JSON.stringify(args)
    );
    const hitLogFound = allInfoCalls.some((entry) =>
      entry.toLowerCase().includes("cache") &&
      (entry.toLowerCase().includes("hit") || entry.toLowerCase().includes("cached"))
    );
    expect(hitLogFound).toBe(false);
  });
});
