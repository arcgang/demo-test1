/**
 * Acceptance tests: PersonalizationAdapter interface and MockPersonalizationAdapter
 * — verifies getPersonalizedRecommendations and applyMerchandisingRules
 *   respect consent state and return seeded plan/bundle/accessory sets
 *   (LLD §4.1 CatalogModule, IR-04, NFR-32, VAL-10).
 *
 * Tests MUST FAIL until the following are implemented:
 *   1. Interface PersonalizationAdapter exported from @/lib/adapters/PersonalizationAdapter
 *   2. Class MockPersonalizationAdapter exported from
 *      @/lib/adapters/mocks/MockPersonalizationAdapter implementing PersonalizationAdapter.
 */

import {
  type PersonalizationAdapter,
  type PersonalizationInput,
  type PersonalizationResult,
  type ConsentState,
  type RecommendedItem,
  type MerchandisingRulesInput,
  type MerchandisingRulesResult,
} from "@/lib/adapters/PersonalizationAdapter";
import { MockPersonalizationAdapter } from "@/lib/adapters/mocks/MockPersonalizationAdapter";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONSENT_GRANTED: ConsentState = {
  personalizationGranted: true,
  marketingGranted: true,
};

const CONSENT_DENIED: ConsentState = {
  personalizationGranted: false,
  marketingGranted: false,
};

const CONSENT_PARTIAL: ConsentState = {
  personalizationGranted: true,
  marketingGranted: false,
};

const BASE_INPUT: PersonalizationInput = {
  customerId: "cust_1001",
  marketCode: "ZA",
  productId: "prod_device_iphone15",
  consent: CONSENT_GRANTED,
};

// ── Interface compliance ───────────────────────────────────────────────────────

describe("PersonalizationAdapter – interface compliance", () => {
  it("MockPersonalizationAdapter implements PersonalizationAdapter", () => {
    const adapter: PersonalizationAdapter = new MockPersonalizationAdapter();
    expect(adapter).toBeDefined();
  });

  it("exposes getPersonalizedRecommendations as a function", () => {
    const adapter: PersonalizationAdapter = new MockPersonalizationAdapter();
    expect(typeof adapter.getPersonalizedRecommendations).toBe("function");
  });

  it("exposes applyMerchandisingRules as a function", () => {
    const adapter: PersonalizationAdapter = new MockPersonalizationAdapter();
    expect(typeof adapter.applyMerchandisingRules).toBe("function");
  });
});

// ── getPersonalizedRecommendations – consent granted ─────────────────────────

describe("MockPersonalizationAdapter.getPersonalizedRecommendations – consent granted", () => {
  it("returns a PersonalizationResult", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    expect(result).toBeDefined();
  });

  it("returns recommendations as an array", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("recommendations are non-empty when personalization consent is granted", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("each recommendation has a recommendationType string", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    for (const rec of result.recommendations) {
      expect(typeof rec.recommendationType).toBe("string");
      expect(rec.recommendationType.length).toBeGreaterThan(0);
    }
  });

  it("each recommendation has a productId string", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    for (const rec of result.recommendations) {
      expect(typeof rec.productId).toBe("string");
      expect(rec.productId.length).toBeGreaterThan(0);
    }
  });

  it("each recommendation has a displayName string", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    for (const rec of result.recommendations) {
      expect(typeof rec.displayName).toBe("string");
    }
  });

  it("includes at least one PLAN or BUNDLE recommendation when consent is granted", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    const hasPlanOrBundle = result.recommendations.some(
      (r) => r.recommendationType === "PLAN" || r.recommendationType === "BUNDLE"
    );
    expect(hasPlanOrBundle).toBe(true);
  });
});

// ── getPersonalizedRecommendations – consent denied ───────────────────────────

describe("MockPersonalizationAdapter.getPersonalizedRecommendations – consent denied", () => {
  it("returns empty recommendations when personalizationGranted is false", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations({
      ...BASE_INPUT,
      consent: CONSENT_DENIED,
    });
    expect(result.recommendations.length).toBe(0);
  });

  it("result still has a recommendations array (not null/undefined) when consent denied", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations({
      ...BASE_INPUT,
      consent: CONSENT_DENIED,
    });
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

// ── getPersonalizedRecommendations – partial consent ─────────────────────────

describe("MockPersonalizationAdapter.getPersonalizedRecommendations – partial consent", () => {
  it("returns recommendations when personalizationGranted is true regardless of marketingGranted", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations({
      ...BASE_INPUT,
      consent: CONSENT_PARTIAL,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("does not include MARKETING-tagged items when marketingGranted is false", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations({
      ...BASE_INPUT,
      consent: CONSENT_PARTIAL,
    });
    const hasMarketing = result.recommendations.some((r) => r.recommendationType === "MARKETING");
    expect(hasMarketing).toBe(false);
  });
});

// ── applyMerchandisingRules ───────────────────────────────────────────────────

describe("MockPersonalizationAdapter.applyMerchandisingRules", () => {
  it("returns a MerchandisingRulesResult", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.applyMerchandisingRules({
      marketCode: "ZA",
      productId: "prod_device_iphone15",
      consent: CONSENT_GRANTED,
    });
    expect(result).toBeDefined();
  });

  it("returns a promotedItems array", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.applyMerchandisingRules({
      marketCode: "ZA",
      productId: "prod_device_iphone15",
      consent: CONSENT_GRANTED,
    });
    expect(Array.isArray(result.promotedItems)).toBe(true);
  });

  it("returns a suppressedItems array", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.applyMerchandisingRules({
      marketCode: "ZA",
      productId: "prod_device_iphone15",
      consent: CONSENT_GRANTED,
    });
    expect(Array.isArray(result.suppressedItems)).toBe(true);
  });

  it("consent denied produces empty promotedItems", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.applyMerchandisingRules({
      marketCode: "ZA",
      productId: "prod_device_iphone15",
      consent: CONSENT_DENIED,
    });
    expect(result.promotedItems.length).toBe(0);
  });
});

// ── PersonalizationResult shape ───────────────────────────────────────────────

describe("PersonalizationResult shape", () => {
  it("contains recommendations array and consentApplied boolean", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result: PersonalizationResult = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("consentApplied");
    expect(typeof result.consentApplied).toBe("boolean");
  });

  it("consentApplied is true when personalizationGranted is true", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations(BASE_INPUT);
    expect(result.consentApplied).toBe(true);
  });

  it("consentApplied is false when personalizationGranted is false", async () => {
    const adapter = new MockPersonalizationAdapter();
    const result = await adapter.getPersonalizedRecommendations({
      ...BASE_INPUT,
      consent: CONSENT_DENIED,
    });
    expect(result.consentApplied).toBe(false);
  });
});
