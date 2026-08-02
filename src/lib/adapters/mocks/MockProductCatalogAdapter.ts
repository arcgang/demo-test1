/**
 * Mock implementation of TMF620 ProductCatalogAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey A — eSIM onboarding (ZA)
 *   Journey B — contract upgrade (ZA)
 *   Journey C — device + plan bundle (TZ)
 *   Journey D — new SIM customer
 */

import type {
  ProductCatalogAdapter,
  MarketContext,
  CatalogProduct,
  ProductOffer,
  ProductBundle,
  SIMOffer,
  ServicePlan,
} from "@/lib/adapters/adapter-interfaces/ProductCatalogAdapter";

const ZA_PRODUCTS: CatalogProduct[] = [
  {
    productId: "prod_device_iphone15",
    productType: "DEVICE",
    name: "iPhone 15",
    price: { onceOff: 18999.0, currency: "ZAR" },
    availabilityStatus: "AVAILABLE",
    marketCode: "ZA",
    badges: ["5G", "Trade-In Eligible"],
    availableAttachments: ["plan_unlimited_20gb", "plan_red_premium"],
  },
  {
    productId: "prod_esim_standard",
    productType: "ESIM",
    name: "Standard eSIM",
    price: { onceOff: 0.0, currency: "ZAR" },
    availabilityStatus: "AVAILABLE",
    marketCode: "ZA",
    badges: ["eSIM"],
  },
  {
    productId: "prod_sim_standard",
    productType: "SIM",
    name: "Standard SIM",
    price: { onceOff: 0.0, currency: "ZAR" },
    availabilityStatus: "AVAILABLE",
    marketCode: "ZA",
  },
  {
    productId: "prod_accessory_case_iphone15",
    productType: "ACCESSORY",
    name: "iPhone 15 Protective Case",
    price: { onceOff: 299.0, currency: "ZAR" },
    availabilityStatus: "AVAILABLE",
    marketCode: "ZA",
  },
];

const TZ_PRODUCTS: CatalogProduct[] = [
  {
    productId: "prod_device_samsung_s24",
    productType: "DEVICE",
    name: "Samsung Galaxy S24",
    price: { onceOff: 850000.0, currency: "TZS" },
    availabilityStatus: "AVAILABLE",
    marketCode: "TZ",
    badges: ["5G"],
    availableAttachments: ["plan_tz_20gb"],
  },
  {
    productId: "prod_sim_tz_standard",
    productType: "SIM",
    name: "Tanzania Standard SIM",
    price: { onceOff: 0.0, currency: "TZS" },
    availabilityStatus: "AVAILABLE",
    marketCode: "TZ",
  },
];

const ALL_PRODUCTS: Record<string, CatalogProduct[]> = {
  ZA: ZA_PRODUCTS,
  TZ: TZ_PRODUCTS,
};

const ZA_OFFERS: ProductOffer[] = [
  {
    offerId: "offer_iphone15_unlimited",
    name: "iPhone 15 + Unlimited 20GB",
    products: ["prod_device_iphone15", "plan_unlimited_20gb"],
    marketCode: "ZA",
  },
  {
    offerId: "offer_iphone15_red",
    name: "iPhone 15 + Red Premium",
    products: ["prod_device_iphone15", "plan_red_premium"],
    marketCode: "ZA",
  },
];

const ZA_BUNDLES: ProductBundle[] = [
  {
    bundleId: "bundle_weekend_max",
    name: "Weekend Max Bundle",
    components: ["prod_device_iphone15", "plan_unlimited_20gb", "prod_accessory_case_iphone15"],
    marketCode: "ZA",
  },
];

const ZA_SIM_OFFERS: SIMOffer[] = [
  {
    simOfferId: "sim_offer_standard_za",
    simType: "SIM",
    name: "ZA Standard SIM",
    marketCode: "ZA",
  },
  {
    simOfferId: "esim_offer_standard_za",
    simType: "ESIM",
    name: "ZA Standard eSIM",
    marketCode: "ZA",
  },
];

const ZA_PLANS: ServicePlan[] = [
  {
    planId: "plan_unlimited_20gb",
    name: "Unlimited 20GB",
    price: { recurring: 799.0, currency: "ZAR" },
    marketCode: "ZA",
  },
  {
    planId: "plan_red_premium",
    name: "Red Premium",
    price: { recurring: 1199.0, currency: "ZAR" },
    marketCode: "ZA",
  },
];

const TZ_PLANS: ServicePlan[] = [
  {
    planId: "plan_tz_20gb",
    name: "Tanzania 20GB",
    price: { recurring: 35000.0, currency: "TZS" },
    marketCode: "TZ",
  },
];

const ALL_PLANS: Record<string, ServicePlan[]> = {
  ZA: ZA_PLANS,
  TZ: TZ_PLANS,
};

export class MockProductCatalogAdapter implements ProductCatalogAdapter {
  async listProducts(context: MarketContext): Promise<CatalogProduct[]> {
    return ALL_PRODUCTS[context.marketCode] ?? [];
  }

  async getProduct(productId: string, context: MarketContext): Promise<CatalogProduct | null> {
    const products = ALL_PRODUCTS[context.marketCode] ?? [];
    return products.find((p) => p.productId === productId) ?? null;
  }

  async listOffers(context: MarketContext): Promise<ProductOffer[]> {
    if (context.marketCode === "ZA") return ZA_OFFERS;
    return [];
  }

  async listBundles(context: MarketContext): Promise<ProductBundle[]> {
    if (context.marketCode === "ZA") return ZA_BUNDLES;
    return [];
  }

  async listSIMOffers(context: MarketContext): Promise<SIMOffer[]> {
    if (context.marketCode === "ZA") return ZA_SIM_OFFERS;
    return [];
  }

  async listPlans(context: MarketContext): Promise<ServicePlan[]> {
    return ALL_PLANS[context.marketCode] ?? [];
  }
}
