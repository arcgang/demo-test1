/**
 * Acceptance tests: market_config seed data declares at least three markets
 * with correct field values.
 *
 * These tests MUST FAIL until the seed module is implemented at
 * @/lib/db/seeds/market-config-seed.
 *
 * Verified markets (LLD §7.2, task spec):
 *   - ZA  South Africa  ZAR  en-ZA  VAT 15%   [CARD_TOKEN, MOBILE_MONEY]
 *   - TZ  Tanzania      TZS  sw-TZ  VAT 18%   [MOBILE_MONEY]
 *   - EG  Egypt         EGP  ar-EG  VAT 14%   [CARD_TOKEN]
 */

import { MARKET_CONFIG_SEED, type MarketConfigSeedRow } from "@/lib/db/seeds/market-config-seed";

// ── Basic existence and shape ────────────────────────────────────────────────

describe("MARKET_CONFIG_SEED – file presence and export", () => {
  it("module exports a non-empty MARKET_CONFIG_SEED array", () => {
    expect(Array.isArray(MARKET_CONFIG_SEED)).toBe(true);
    expect(MARKET_CONFIG_SEED.length).toBeGreaterThanOrEqual(3);
  });

  it("every row has all required fields (no hard-coded stubs)", () => {
    MARKET_CONFIG_SEED.forEach((row: MarketConfigSeedRow) => {
      expect(typeof row.marketCode).toBe("string");
      expect(typeof row.marketName).toBe("string");
      expect(typeof row.localeCode).toBe("string");
      expect(typeof row.currencyCode).toBe("string");
      expect(typeof row.taxLabel).toBe("string");
      expect(typeof row.mobileMoneyEnabled).toBe("boolean");
      expect(typeof row.cardPaymentEnabled).toBe("boolean");
      expect(typeof row.liteModeDefault).toBe("boolean");
    });
  });

  it("marketCode is uppercase and 2–4 characters on every row (no empty strings)", () => {
    MARKET_CONFIG_SEED.forEach((row: MarketConfigSeedRow) => {
      expect(row.marketCode).toMatch(/^[A-Z]{2,4}$/);
    });
  });

  it("all marketCode values are unique", () => {
    const codes = MARKET_CONFIG_SEED.map((r) => r.marketCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("taxLabel is a non-empty string on every row", () => {
    MARKET_CONFIG_SEED.forEach((row: MarketConfigSeedRow) => {
      expect(row.taxLabel.trim().length).toBeGreaterThan(0);
    });
  });
});

// ── South Africa (ZA) ────────────────────────────────────────────────────────

describe("MARKET_CONFIG_SEED – South Africa (ZA)", () => {
  let za: MarketConfigSeedRow | undefined;

  beforeAll(() => {
    za = MARKET_CONFIG_SEED.find((r) => r.marketCode === "ZA");
  });

  it("contains a ZA row", () => {
    expect(za).toBeDefined();
  });

  it("ZA marketName is 'South Africa'", () => {
    expect(za!.marketName).toBe("South Africa");
  });

  it("ZA currencyCode is 'ZAR'", () => {
    expect(za!.currencyCode).toBe("ZAR");
  });

  it("ZA localeCode is 'en-ZA'", () => {
    expect(za!.localeCode).toBe("en-ZA");
  });

  it("ZA taxLabel indicates VAT", () => {
    expect(za!.taxLabel.toUpperCase()).toContain("VAT");
  });

  it("ZA tax rate context is 15% (taxLabel contains '15')", () => {
    expect(za!.taxLabel).toContain("15");
  });

  it("ZA cardPaymentEnabled is true", () => {
    expect(za!.cardPaymentEnabled).toBe(true);
  });

  it("ZA mobileMoneyEnabled is true", () => {
    expect(za!.mobileMoneyEnabled).toBe(true);
  });
});

// ── Tanzania (TZ) ────────────────────────────────────────────────────────────

describe("MARKET_CONFIG_SEED – Tanzania (TZ)", () => {
  let tz: MarketConfigSeedRow | undefined;

  beforeAll(() => {
    tz = MARKET_CONFIG_SEED.find((r) => r.marketCode === "TZ");
  });

  it("contains a TZ row", () => {
    expect(tz).toBeDefined();
  });

  it("TZ marketName is 'Tanzania'", () => {
    expect(tz!.marketName).toBe("Tanzania");
  });

  it("TZ currencyCode is 'TZS'", () => {
    expect(tz!.currencyCode).toBe("TZS");
  });

  it("TZ localeCode is 'sw-TZ'", () => {
    expect(tz!.localeCode).toBe("sw-TZ");
  });

  it("TZ taxLabel indicates VAT", () => {
    expect(tz!.taxLabel.toUpperCase()).toContain("VAT");
  });

  it("TZ tax rate context is 18% (taxLabel contains '18')", () => {
    expect(tz!.taxLabel).toContain("18");
  });

  it("TZ mobileMoneyEnabled is true", () => {
    expect(tz!.mobileMoneyEnabled).toBe(true);
  });

  it("TZ cardPaymentEnabled is false", () => {
    expect(tz!.cardPaymentEnabled).toBe(false);
  });
});

// ── Egypt (EG) ───────────────────────────────────────────────────────────────

describe("MARKET_CONFIG_SEED – Egypt (EG)", () => {
  let eg: MarketConfigSeedRow | undefined;

  beforeAll(() => {
    eg = MARKET_CONFIG_SEED.find((r) => r.marketCode === "EG");
  });

  it("contains an EG row", () => {
    expect(eg).toBeDefined();
  });

  it("EG marketName is 'Egypt'", () => {
    expect(eg!.marketName).toBe("Egypt");
  });

  it("EG currencyCode is 'EGP'", () => {
    expect(eg!.currencyCode).toBe("EGP");
  });

  it("EG localeCode is 'ar-EG'", () => {
    expect(eg!.localeCode).toBe("ar-EG");
  });

  it("EG taxLabel indicates VAT", () => {
    expect(eg!.taxLabel.toUpperCase()).toContain("VAT");
  });

  it("EG tax rate context is 14% (taxLabel contains '14')", () => {
    expect(eg!.taxLabel).toContain("14");
  });

  it("EG cardPaymentEnabled is true", () => {
    expect(eg!.cardPaymentEnabled).toBe(true);
  });

  it("EG mobileMoneyEnabled is false", () => {
    expect(eg!.mobileMoneyEnabled).toBe(false);
  });
});

// ── TypeScript interface completeness ────────────────────────────────────────

describe("MARKET_CONFIG_SEED – TypeScript type contract", () => {
  it("MarketConfigSeedRow interface enforces the required field set", () => {
    // Compile-time check: constructing a valid row object must typecheck.
    const row: MarketConfigSeedRow = {
      marketCode: "ZW",
      marketName: "Zimbabwe",
      localeCode: "en-ZW",
      currencyCode: "ZWL",
      taxLabel: "VAT 15%",
      mobileMoneyEnabled: true,
      cardPaymentEnabled: false,
      liteModeDefault: false,
    };
    expect(row.marketCode).toBe("ZW");
  });
});
