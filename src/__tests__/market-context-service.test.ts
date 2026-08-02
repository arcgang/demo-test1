/**
 * Acceptance tests: MarketContextService reads exclusively from market_config
 * via its injected repository — no hard-coded market values (NFR-33).
 *
 * These tests MUST FAIL until the service is implemented at
 * @/lib/services/MarketContextService.
 *
 * The service is exercised through a mock repository so these tests have
 * zero external dependencies and run inside the jsdom Jest environment.
 */

import {
  MarketContextService,
  type MarketConfig,
  type MarketConfigRepository,
} from "@/lib/services/MarketContextService";

// ── Test fixture ─────────────────────────────────────────────────────────────

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

const EG_CONFIG: MarketConfig = {
  marketCode: "EG",
  marketName: "Egypt",
  localeCode: "ar-EG",
  currencyCode: "EGP",
  taxLabel: "VAT 14%",
  mobileMoneyEnabled: false,
  cardPaymentEnabled: true,
  liteModeDefault: false,
};

const ALL_CONFIGS = [ZA_CONFIG, TZ_CONFIG, EG_CONFIG];

function makeMockRepo(configs: MarketConfig[]): jest.Mocked<MarketConfigRepository> {
  return {
    findByCode: jest.fn((code: string) =>
      Promise.resolve(configs.find((c) => c.marketCode === code) ?? null)
    ),
    findAll: jest.fn(() => Promise.resolve(configs)),
  };
}

// ── Service instantiation ────────────────────────────────────────────────────

describe("MarketContextService – constructor", () => {
  it("can be instantiated with a repository", () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);
    expect(service).toBeDefined();
  });
});

// ── getMarket ────────────────────────────────────────────────────────────────

describe("MarketContextService.getMarket", () => {
  it("returns MarketConfig for a known market code (ZA)", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const result = await service.getMarket("ZA");

    expect(result).not.toBeNull();
    expect(result!.marketCode).toBe("ZA");
    expect(result!.currencyCode).toBe("ZAR");
    expect(result!.localeCode).toBe("en-ZA");
    expect(result!.taxLabel).toBe("VAT 15%");
    expect(result!.cardPaymentEnabled).toBe(true);
    expect(result!.mobileMoneyEnabled).toBe(true);
  });

  it("returns MarketConfig for TZ with mobile-money only", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const result = await service.getMarket("TZ");

    expect(result).not.toBeNull();
    expect(result!.currencyCode).toBe("TZS");
    expect(result!.mobileMoneyEnabled).toBe(true);
    expect(result!.cardPaymentEnabled).toBe(false);
  });

  it("returns MarketConfig for EG with card-only", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const result = await service.getMarket("EG");

    expect(result).not.toBeNull();
    expect(result!.currencyCode).toBe("EGP");
    expect(result!.cardPaymentEnabled).toBe(true);
    expect(result!.mobileMoneyEnabled).toBe(false);
  });

  it("returns null for an unrecognised market code", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const result = await service.getMarket("XX");

    expect(result).toBeNull();
  });

  it("delegates to repo.findByCode exactly once with the supplied code", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");

    expect(repo.findByCode).toHaveBeenCalledTimes(1);
    expect(repo.findByCode).toHaveBeenCalledWith("ZA");
  });

  it("does NOT call repo.findAll when resolving a single market", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    await service.getMarket("ZA");

    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it("never returns hard-coded data — all values come from the repository", async () => {
    // Override ZA with deliberately different values to prove no hard-coding
    const mutatedZA: MarketConfig = {
      ...ZA_CONFIG,
      currencyCode: "FAKE",
      taxLabel: "GST 99%",
    };
    const repo = makeMockRepo([mutatedZA, TZ_CONFIG, EG_CONFIG]);
    const service = new MarketContextService(repo);

    const result = await service.getMarket("ZA");

    expect(result!.currencyCode).toBe("FAKE");
    expect(result!.taxLabel).toBe("GST 99%");
  });
});

// ── getEnabledPaymentMethods ─────────────────────────────────────────────────

describe("MarketContextService.getEnabledPaymentMethods", () => {
  it("returns CARD_TOKEN and MOBILE_MONEY for ZA (both enabled)", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const methods = await service.getEnabledPaymentMethods("ZA");

    expect(methods).toContain("CARD_TOKEN");
    expect(methods).toContain("MOBILE_MONEY");
  });

  it("returns only MOBILE_MONEY for TZ (card disabled)", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const methods = await service.getEnabledPaymentMethods("TZ");

    expect(methods).toContain("MOBILE_MONEY");
    expect(methods).not.toContain("CARD_TOKEN");
  });

  it("returns only CARD_TOKEN for EG (mobile money disabled)", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    const methods = await service.getEnabledPaymentMethods("EG");

    expect(methods).toContain("CARD_TOKEN");
    expect(methods).not.toContain("MOBILE_MONEY");
  });

  it("throws or returns an empty array for an unknown market code", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    let threw = false;
    let methods: string[] = [];
    try {
      methods = await service.getEnabledPaymentMethods("XX");
    } catch {
      threw = true;
    }
    // Either a thrown error or an empty result is acceptable — never silently
    // returns data that belongs to a different market
    if (!threw) {
      expect(methods.length).toBe(0);
    }
    expect(true).toBe(true); // one of the two branches executed
  });

  it("derives methods from repository data, not hard-coded values", async () => {
    // Override ZA to disable mobile money
    const noMobileMoney: MarketConfig = { ...ZA_CONFIG, mobileMoneyEnabled: false };
    const repo = makeMockRepo([noMobileMoney]);
    const service = new MarketContextService(repo);

    const methods = await service.getEnabledPaymentMethods("ZA");

    expect(methods).not.toContain("MOBILE_MONEY");
    expect(methods).toContain("CARD_TOKEN");
  });
});

// ── isMarketSupported ────────────────────────────────────────────────────────

describe("MarketContextService.isMarketSupported", () => {
  it("returns true for ZA", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    expect(await service.isMarketSupported("ZA")).toBe(true);
  });

  it("returns true for TZ", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    expect(await service.isMarketSupported("TZ")).toBe(true);
  });

  it("returns true for EG", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    expect(await service.isMarketSupported("EG")).toBe(true);
  });

  it("returns false for an unrecognised code", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);
    const service = new MarketContextService(repo);

    expect(await service.isMarketSupported("XX")).toBe(false);
  });

  it("returns false when market list is empty", async () => {
    const repo = makeMockRepo([]);
    const service = new MarketContextService(repo);

    expect(await service.isMarketSupported("ZA")).toBe(false);
  });
});

// ── MarketConfigRepository interface ─────────────────────────────────────────

describe("MarketConfigRepository – interface contract", () => {
  it("findByCode resolves to MarketConfig or null", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);

    const found = await repo.findByCode("ZA");
    const missing = await repo.findByCode("NOPE");

    expect(found).not.toBeNull();
    expect(missing).toBeNull();
  });

  it("findAll resolves to an array of MarketConfig", async () => {
    const repo = makeMockRepo(ALL_CONFIGS);

    const all = await repo.findAll();

    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(3);
  });
});
