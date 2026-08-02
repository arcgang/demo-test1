/**
 * PersonalizationAdapter — integration boundary for the Personalization Rule Boundary.
 *
 * Business capability: produce consent-aware plan, bundle, and accessory
 * recommendations and apply merchandising promotion/suppression rules that
 * respect the customer's recorded consent state.
 *
 * Compliance domain: POPIA purpose limitation — personalized and marketing
 * content must only be surfaced when the corresponding consent purpose has
 * been explicitly granted; no personalized content may be served when
 * personalizationGranted is false (LLD §4.1 CatalogModule, VAL-10,
 * IR-04, NFR-32).
 *
 * All implementations must be substitutable without changing domain service
 * logic (IR-04).
 */

/** Recorded consent state for a customer or session. */
export interface ConsentState {
  personalizationGranted: boolean;
  marketingGranted: boolean;
}

/** A single personalized recommendation item. */
export interface RecommendedItem {
  /** PLAN | BUNDLE | ACCESSORY | MARKETING */
  recommendationType: string;
  productId: string;
  displayName: string;
}

/** Input for retrieving personalized recommendations. */
export interface PersonalizationInput {
  customerId: string;
  marketCode: string;
  productId: string;
  consent: ConsentState;
}

/** Result containing consent-filtered recommendations. */
export interface PersonalizationResult {
  recommendations: RecommendedItem[];
  /** True when personalizationGranted was true and rules were applied. */
  consentApplied: boolean;
}

/** Input for applying merchandising promotion and suppression rules. */
export interface MerchandisingRulesInput {
  marketCode: string;
  productId: string;
  consent: ConsentState;
}

/** Result of applying merchandising rules. */
export interface MerchandisingRulesResult {
  /** Product IDs promoted for visibility in the current context. */
  promotedItems: string[];
  /** Product IDs suppressed from display in the current context. */
  suppressedItems: string[];
}

/**
 * PersonalizationAdapter — contract for consent-aware personalization service interactions.
 *
 * Used by CatalogModule (RecommendationService) to surface plan, bundle,
 * accessory, and migration suggestions on the PDP and upgrade journey screens.
 */
export interface PersonalizationAdapter {
  /**
   * Return consent-filtered personalized recommendations for a customer
   * viewing a specific product. Returns an empty recommendations list when
   * personalizationGranted is false.
   */
  getPersonalizedRecommendations(input: PersonalizationInput): Promise<PersonalizationResult>;

  /**
   * Apply market and product-level merchandising promotion and suppression
   * rules. Returns empty promotedItems when consent is not granted.
   */
  applyMerchandisingRules(input: MerchandisingRulesInput): Promise<MerchandisingRulesResult>;
}
