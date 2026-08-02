export type OfferType = "SIM" | "eSIM";
export type FulfilmentPath = "PHYSICAL_DELIVERY" | "DIGITAL_ISSUANCE";

export interface SimEsimOffer {
  offerId: string;
  offerType: OfferType;
  name: string;
  planIds: string[];
  priceOnce: number;
  priceMonthly: number;
  currency: string;
  fulfilmentPath: FulfilmentPath;
  marketAvailability: string[];
}

export const SIM_ESIM_CATALOG_SEED: SimEsimOffer[] = [
  {
    offerId: "sim-za-standard",
    offerType: "SIM",
    name: "Standard SIM",
    planIds: ["plan_unlimited_20gb", "plan_red_premium"],
    priceOnce: 0,
    priceMonthly: 0,
    currency: "ZAR",
    fulfilmentPath: "PHYSICAL_DELIVERY",
    marketAvailability: ["ZA"],
  },
  {
    offerId: "sim-za-red",
    offerType: "SIM",
    name: "Red SIM",
    planIds: ["plan_red_premium"],
    priceOnce: 0,
    priceMonthly: 0,
    currency: "ZAR",
    fulfilmentPath: "PHYSICAL_DELIVERY",
    marketAvailability: ["ZA"],
  },
  {
    offerId: "esim-za-standard",
    offerType: "eSIM",
    name: "Standard eSIM",
    planIds: ["plan_unlimited_20gb", "plan_red_premium"],
    priceOnce: 0,
    priceMonthly: 0,
    currency: "ZAR",
    fulfilmentPath: "DIGITAL_ISSUANCE",
    marketAvailability: ["ZA"],
  },
  {
    offerId: "esim-za-premium",
    offerType: "eSIM",
    name: "Premium eSIM",
    planIds: ["plan_red_premium", "plan_unlimited_20gb"],
    priceOnce: 49,
    priceMonthly: 0,
    currency: "ZAR",
    fulfilmentPath: "DIGITAL_ISSUANCE",
    marketAvailability: ["ZA"],
  },
];
