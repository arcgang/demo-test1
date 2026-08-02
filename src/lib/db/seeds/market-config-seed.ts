export interface MarketConfigSeedRow {
  marketCode: string;
  marketName: string;
  localeCode: string;
  currencyCode: string;
  taxLabel: string;
  mobileMoneyEnabled: boolean;
  cardPaymentEnabled: boolean;
  liteModeDefault: boolean;
}

export const MARKET_CONFIG_SEED: MarketConfigSeedRow[] = [
  {
    marketCode: "ZA",
    marketName: "South Africa",
    localeCode: "en-ZA",
    currencyCode: "ZAR",
    taxLabel: "VAT 15%",
    mobileMoneyEnabled: true,
    cardPaymentEnabled: true,
    liteModeDefault: false,
  },
  {
    marketCode: "TZ",
    marketName: "Tanzania",
    localeCode: "sw-TZ",
    currencyCode: "TZS",
    taxLabel: "VAT 18%",
    mobileMoneyEnabled: true,
    cardPaymentEnabled: false,
    liteModeDefault: true,
  },
  {
    marketCode: "EG",
    marketName: "Egypt",
    localeCode: "ar-EG",
    currencyCode: "EGP",
    taxLabel: "VAT 14%",
    mobileMoneyEnabled: false,
    cardPaymentEnabled: true,
    liteModeDefault: false,
  },
];
