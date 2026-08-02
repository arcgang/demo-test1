import type {
  TradeInAdapter,
  TradeInDevice,
  ValuationEstimateInput,
  ValuationEstimateResult,
  TradeInRequestInput,
  TradeInRequestResult,
  TradeInCreditConfirmInput,
  TradeInCreditConfirmResult,
} from "@/lib/adapters/TradeInAdapter";

/** Multipliers applied to base price per condition tier. */
const CONDITION_FACTOR: Record<string, number> = {
  EXCELLENT: 1.0,
  GOOD: 0.75,
  FAIR: 0.45,
};

/** Additional multiplier applied when screen has no damage. */
const SCREEN_FACTOR: Record<string, number> = {
  NO_DAMAGE: 1.0,
  MINOR_SCRATCHES: 0.95,
  CRACKED: 0.7,
};

/** Base trade-in values (ZAR) keyed by brand+model. */
const BASE_VALUES: Record<string, number> = {
  "apple_iphone 12": 5000,
  "apple_iphone 13": 6500,
  "apple_iphone 14": 8500,
  "apple_iphone 15": 10000,
  "apple_iphone 15 pro": 12000,
  "samsung_galaxy s21": 4000,
  "samsung_galaxy s22": 5500,
  "samsung_galaxy s23": 7000,
  "samsung_galaxy s24": 8500,
  "samsung_galaxy s24 ultra": 10500,
  "samsung_galaxy a54": 2500,
};

const DEFAULT_BASE = 2000;

/** Bonus credit (ZAR) added per additional 128 GB beyond the base 128 GB. */
const STORAGE_BONUS_PER_128GB = 200;

const CURRENCY_BY_MARKET: Record<string, string> = {
  ZA: "ZAR",
  TZ: "TZS",
  EG: "EGP",
};

function baseKey(device: TradeInDevice): string {
  return `${device.brand.toLowerCase()}_${device.model.toLowerCase()}`;
}

function estimate(device: TradeInDevice): number {
  const base = BASE_VALUES[baseKey(device)] ?? DEFAULT_BASE;
  const condFactor = CONDITION_FACTOR[device.condition] ?? 0.45;
  const screenFactor = SCREEN_FACTOR[device.screenCondition] ?? 0.7;
  const storageBonus =
    Math.max(0, Math.floor((device.storageGb - 128) / 128)) * STORAGE_BONUS_PER_128GB;
  return Math.round((base * condFactor * screenFactor + storageBonus) * 100) / 100;
}

let quoteCounter = 780;
let requestCounter = 0;

/** Quote expiry — 72 hours from a fixed reference epoch. */
const EXPIRES_AT = "2026-07-31T23:59:59Z";

/**
 * MockTradeInAdapter — deterministic trade-in valuation adapter for demo and testing.
 *
 * Valuations are keyed to brand, model, storage, and condition combinations.
 * The same inputs always produce the same credit estimate (LLD §5.9, IR-04).
 */
export class MockTradeInAdapter implements TradeInAdapter {
  async getValuationEstimate(input: ValuationEstimateInput): Promise<ValuationEstimateResult> {
    quoteCounter += 1;
    const currency = CURRENCY_BY_MARKET[input.marketCode] ?? "ZAR";
    return {
      tradeInQuoteId: `tiq_${quoteCounter}`,
      status: "QUOTED",
      estimatedCredit: estimate(input.device),
      currency,
      expiresAt: EXPIRES_AT,
      disclaimer: "Final inspection may adjust credit.",
    };
  }

  async submitTradeInRequest(input: TradeInRequestInput): Promise<TradeInRequestResult> {
    requestCounter += 1;
    return {
      tradeInRequestId: `tir_${String(requestCounter).padStart(3, "0")}`,
      tradeInQuoteId: input.tradeInQuoteId,
      requestStatus: "SUBMITTED",
    };
  }

  async confirmTradeInCredit(input: TradeInCreditConfirmInput): Promise<TradeInCreditConfirmResult> {
    const currency = CURRENCY_BY_MARKET[input.marketCode] ?? "ZAR";
    return {
      confirmedCreditAmount: 2500,
      creditStatus: "CONFIRMED",
      currency,
    };
  }
}
