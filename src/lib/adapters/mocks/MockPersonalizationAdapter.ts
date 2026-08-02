import type {
  PersonalizationAdapter,
  PersonalizationInput,
  PersonalizationResult,
  RecommendedItem,
  MerchandisingRulesInput,
  MerchandisingRulesResult,
} from "@/lib/adapters/PersonalizationAdapter";

/** Seeded recommendations keyed by productId (LLD §4.1 CatalogModule). */
const RECOMMENDATIONS: Record<string, RecommendedItem[]> = {
  prod_device_iphone15: [
    { recommendationType: "PLAN", productId: "plan_unlimited_20gb", displayName: "Unlimited 20GB" },
    { recommendationType: "BUNDLE", productId: "bundle_weekend_max", displayName: "Weekend Max Bundle" },
    { recommendationType: "ACCESSORY", productId: "acc_magsafe_charger", displayName: "MagSafe Charger" },
    { recommendationType: "MARKETING", productId: "promo_trade_in_bonus", displayName: "Trade-In Bonus Offer" },
  ],
  prod_device_iphone15pro: [
    { recommendationType: "PLAN", productId: "plan_red_premium", displayName: "Red Premium Plan" },
    { recommendationType: "BUNDLE", productId: "bundle_weekend_max", displayName: "Weekend Max Bundle" },
    { recommendationType: "ACCESSORY", productId: "acc_magsafe_charger", displayName: "MagSafe Charger" },
    { recommendationType: "MARKETING", productId: "promo_upgrade_cashback", displayName: "Upgrade Cashback" },
  ],
  prod_device_s24ultra: [
    { recommendationType: "PLAN", productId: "plan_unlimited_20gb", displayName: "Unlimited 20GB" },
    { recommendationType: "BUNDLE", productId: "bundle_weekend_max", displayName: "Weekend Max Bundle" },
    { recommendationType: "ACCESSORY", productId: "acc_s_pen_pro", displayName: "S Pen Pro" },
    { recommendationType: "MARKETING", productId: "promo_galaxy_ai", displayName: "Galaxy AI Feature Promo" },
  ],
};

/** Default recommendations used when productId has no seeded entry. */
const DEFAULT_RECOMMENDATIONS: RecommendedItem[] = [
  { recommendationType: "PLAN", productId: "plan_unlimited_20gb", displayName: "Unlimited 20GB" },
  { recommendationType: "BUNDLE", productId: "bundle_weekend_max", displayName: "Weekend Max Bundle" },
];

/** Products promoted at the market level regardless of product context. */
const MARKET_PROMOTED: Record<string, string[]> = {
  ZA: ["plan_unlimited_20gb", "bundle_weekend_max"],
  TZ: ["plan_unlimited_20gb"],
  EG: ["plan_unlimited_20gb"],
};

/**
 * MockPersonalizationAdapter — consent-aware personalization adapter for demo and testing.
 *
 * Returns empty recommendations when personalizationGranted is false.
 * Excludes MARKETING items when marketingGranted is false (VAL-10, IR-04).
 */
export class MockPersonalizationAdapter implements PersonalizationAdapter {
  async getPersonalizedRecommendations(input: PersonalizationInput): Promise<PersonalizationResult> {
    if (!input.consent.personalizationGranted) {
      return { recommendations: [], consentApplied: false };
    }

    const seeded = RECOMMENDATIONS[input.productId] ?? DEFAULT_RECOMMENDATIONS;

    const recommendations = seeded.filter((r) => {
      if (r.recommendationType === "MARKETING" && !input.consent.marketingGranted) return false;
      return true;
    });

    return { recommendations, consentApplied: true };
  }

  async applyMerchandisingRules(input: MerchandisingRulesInput): Promise<MerchandisingRulesResult> {
    if (!input.consent.personalizationGranted) {
      return { promotedItems: [], suppressedItems: [] };
    }

    const promotedItems = MARKET_PROMOTED[input.marketCode] ?? [];
    return { promotedItems, suppressedItems: [] };
  }
}
