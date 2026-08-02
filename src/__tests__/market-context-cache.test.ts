/**
 * Acceptance tests: MarketContextService in-process TTL cache
 *
 * These tests MUST FAIL until the caching layer is implemented in
 * @/lib/services/MarketContextService.
 *
 * Acceptance criteria verified here:
 *   1. Repeated getMarket calls for the same code hit repo.findByCode only
 *      once during the TTL window (cache hit on second call).
 *   2. Cache expires after the configured TTL — a call after expiry triggers
 *      a fresh repo.findByCode.
 *   3. TTL is tunable via the MARKET_CONFIG_TTL_MS environment variable.
 *   4. Cache is keyed per market code — a miss for one code does not warm
 *      the cache for another code.
 *   5. A stale entry is not returned after TTL expiry.
 */

import {
  MarketContextService,
  type MarketConfig,
  type MarketConfigRepository,
} from "@/lib/services/MarketContextService";

// ── Fixture ────────────────────────────────────────────────────────────────────

const ZA_CONFIG: MarketConfig = {
  marketCode: "ZA",
  marketName: "South Africa",
  localeCode: "en-ZA",
  currencyCode: "ZAR",
  taxLabel: "VAT 15%",
  mobileMoneyEnabled: true,
  cardPaymentEnabled: true,
  liteModeDefault: false,
};

const TZ_CONFIG: MarketConfig = {
  marketCode: "TZ",
  marketName: "Tanzania",
  localeCode: "sw-TZ",
  currencyCode: "TZS",
  taxLabel: "VAT 18%",
  mobileMoneyEnabled: true,
  cardPaymentEnabled: false,
  liteModeDefault: true,
};

function makeMockRepo(configs: MarketConfig[]): jest.Mocked<MarketConfigRepository> {
  return {
    findByCode: jest.fn((code: string) =>
      Promise.resolve(configs.find((c) => c.marketCode === code) ?? null)
    ),
    findAll: jest.fn(() => Promise.resolve(configs)),
  };
}

// ── Cache hit — second call skips repo ─────────────────────────────────────────

describe("MarketContextService cache – hit on second call", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env["MARKET_CONFIG_TTL_MS"];
  });

  it("calls repo.findByCode only once when getMarket is called twice in quick succession", async () => {
    const repo = makeMockRepo([ZA_CONFIG, TZ_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");
    await service.getMarket("ZA");

    expect(repo.findByCode).toHaveBeenCalledTimes(1);
  });

  it("returns the same MarketConfig on the second call (served from cache)", async () => {
    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    const first = await service.getMarket("ZA");
    const second = await service.getMarket("ZA");

    expect(second).toEqual(first);
    expect(second?.marketCode).toBe("ZA");
  });

  it("a null result (unknown code) is also cached — repo called only once", async () => {
    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    const first = await service.getMarket("XX");
    const second = await service.getMarket("XX");

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(repo.findByCode).toHaveBeenCalledTimes(1);
  });
});

// ── Cache miss on different codes ──────────────────────────────────────────────

describe("MarketContextService cache – per-code keying", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["MARKET_CONFIG_TTL_MS"];
  });

  it("a cache hit for ZA does not prevent a repo call for TZ", async () => {
    const repo = makeMockRepo([ZA_CONFIG, TZ_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");
    await service.getMarket("ZA"); // cache hit
    await service.getMarket("TZ"); // different key — should call repo

    expect(repo.findByCode).toHaveBeenCalledTimes(2);
    expect(repo.findByCode).toHaveBeenCalledWith("ZA");
    expect(repo.findByCode).toHaveBeenCalledWith("TZ");
  });

  it("each code is independently cached after its first call", async () => {
    const repo = makeMockRepo([ZA_CONFIG, TZ_CONFIG]);
    const service = new MarketContextService(repo);

    // Prime both codes
    await service.getMarket("ZA");
    await service.getMarket("TZ");

    // Call both again — should hit cache for both
    await service.getMarket("ZA");
    await service.getMarket("TZ");

    // Repo called once per unique code
    expect(repo.findByCode).toHaveBeenCalledTimes(2);
  });
});

// ── TTL expiry — cache miss after TTL ──────────────────────────────────────────

describe("MarketContextService cache – TTL expiry", () => {
  const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["MARKET_CONFIG_TTL_MS"];
  });

  it("calls repo again after the default 5-minute TTL has elapsed", async () => {
    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA"); // primes cache
    jest.advanceTimersByTime(DEFAULT_TTL_MS + 1);
    await service.getMarket("ZA"); // TTL expired → repo call

    expect(repo.findByCode).toHaveBeenCalledTimes(2);
  });

  it("does NOT call repo again when TTL has not yet elapsed", async () => {
    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");
    jest.advanceTimersByTime(DEFAULT_TTL_MS - 1000); // 1 second before expiry
    await service.getMarket("ZA");

    expect(repo.findByCode).toHaveBeenCalledTimes(1);
  });

  it("serves fresh data from repo after TTL expiry (not stale cached value)", async () => {
    const mutableConfig = { ...ZA_CONFIG, currencyCode: "ZAR" };
    const repo: jest.Mocked<MarketConfigRepository> = {
      findByCode: jest.fn(() => Promise.resolve({ ...mutableConfig })),
      findAll: jest.fn(() => Promise.resolve([{ ...mutableConfig }])),
    };
    const service = new MarketContextService(repo);

    await service.getMarket("ZA"); // caches { currencyCode: "ZAR" }

    // Simulate the upstream source changing
    (repo.findByCode as jest.Mock).mockResolvedValueOnce({
      ...ZA_CONFIG,
      currencyCode: "ZAR_UPDATED",
    });

    jest.advanceTimersByTime(DEFAULT_TTL_MS + 1);
    const fresh = await service.getMarket("ZA");

    expect(fresh?.currencyCode).toBe("ZAR_UPDATED");
  });
});

// ── Tunable TTL via environment variable ────────────────────────────────────────

describe("MarketContextService cache – MARKET_CONFIG_TTL_MS env var", () => {
  afterEach(() => {
    jest.useRealTimers();
    delete process.env["MARKET_CONFIG_TTL_MS"];
  });

  it("respects a custom TTL of 1 000 ms set via MARKET_CONFIG_TTL_MS", async () => {
    process.env["MARKET_CONFIG_TTL_MS"] = "1000";
    jest.useFakeTimers();

    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA"); // primes cache with 1 s TTL
    jest.advanceTimersByTime(500); // still within TTL
    await service.getMarket("ZA"); // should hit cache

    expect(repo.findByCode).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(501); // now past 1 000 ms
    await service.getMarket("ZA"); // should miss cache

    expect(repo.findByCode).toHaveBeenCalledTimes(2);
  });

  it("uses the default 5-minute TTL when MARKET_CONFIG_TTL_MS is not set", async () => {
    delete process.env["MARKET_CONFIG_TTL_MS"];
    jest.useFakeTimers();

    const repo = makeMockRepo([ZA_CONFIG]);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");
    jest.advanceTimersByTime(4 * 60 * 1000); // 4 minutes — should still be cached
    await service.getMarket("ZA");

    expect(repo.findByCode).toHaveBeenCalledTimes(1);
  });
});
