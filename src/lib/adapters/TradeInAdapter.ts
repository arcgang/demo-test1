/**
 * TradeInAdapter — integration boundary for the Trade-In Valuation Service.
 *
 * Business capability: obtain deterministic device trade-in credit estimates
 * keyed to brand, model, storage, and condition, apply credits to upgrade
 * journeys, and confirm final credit amounts after physical inspection.
 *
 * Compliance domain: consumer credit and promotional pricing accuracy; final
 * amounts may be adjusted after inspection and must be disclosed (LLD §5.9,
 * IR-04, NFR-32).
 *
 * All implementations must be substitutable without changing domain service
 * logic (IR-04).
 */

/** Device details submitted for trade-in valuation. */
export interface TradeInDevice {
  brand: string;
  model: string;
  storageGb: number;
  /** EXCELLENT | GOOD | FAIR */
  condition: string;
  /** NO_DAMAGE | MINOR_SCRATCHES | CRACKED */
  screenCondition: string;
}

/** Input to retrieve an indicative trade-in credit estimate. */
export interface ValuationEstimateInput {
  customerId: string;
  marketCode: string;
  device: TradeInDevice;
}

/** Indicative trade-in credit estimate returned by the valuation service. */
export interface ValuationEstimateResult {
  tradeInQuoteId: string;
  /** QUOTED when a credit estimate is available. */
  status: string;
  estimatedCredit: number;
  currency: string;
  /** ISO 8601 timestamp after which the estimate is no longer valid. */
  expiresAt: string;
  disclaimer: string;
}

/** Input to formally submit a trade-in request. */
export interface TradeInRequestInput {
  customerId: string;
  marketCode: string;
  tradeInQuoteId: string;
  device: TradeInDevice;
}

/** Result of submitting a trade-in request. */
export interface TradeInRequestResult {
  tradeInRequestId: string;
  tradeInQuoteId: string;
  /** SUBMITTED | ACCEPTED */
  requestStatus: string;
}

/** Input to confirm a trade-in credit after physical inspection. */
export interface TradeInCreditConfirmInput {
  tradeInRequestId: string;
  tradeInQuoteId: string;
  marketCode: string;
}

/** Final confirmed credit amount returned after inspection. */
export interface TradeInCreditConfirmResult {
  confirmedCreditAmount: number;
  /** CONFIRMED when the inspected amount matches the estimate; ADJUSTED otherwise. */
  creditStatus: string;
  currency: string;
}

/**
 * TradeInAdapter — contract for trade-in valuation service interactions.
 *
 * Used by TradeInModule to support upgrade journey credit application
 * and checkout summary integration.
 */
export interface TradeInAdapter {
  /** Return a deterministic indicative credit estimate for the supplied device. */
  getValuationEstimate(input: ValuationEstimateInput): Promise<ValuationEstimateResult>;

  /** Submit a trade-in request against a previously obtained quote. */
  submitTradeInRequest(input: TradeInRequestInput): Promise<TradeInRequestResult>;

  /** Confirm the final credit amount following physical device inspection. */
  confirmTradeInCredit(input: TradeInCreditConfirmInput): Promise<TradeInCreditConfirmResult>;
}
