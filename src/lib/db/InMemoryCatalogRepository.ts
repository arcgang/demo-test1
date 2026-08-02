import type { CatalogRepository, CatalogRow } from "@/lib/services/CatalogService";

const SEED: CatalogRow[] = [
  {
    productId: "prod_device_iphone15",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "iPhone 15",
    priceOnceOff: 18999.0,
    priceRecurring: 0,
    currencyCode: "ZAR",
    availabilityStatus: "IN_STOCK",
    badges: ["5G", "Trade-In Eligible"],
    imageUrl: "https://cdn.example.com/iphone15-hires.jpg",
    promoVideoUrl: "https://cdn.example.com/iphone15-promo.mp4",
    alternateImages: [
      "https://cdn.example.com/iphone15-alt1.jpg",
      "https://cdn.example.com/iphone15-alt2.jpg",
    ],
  },
  {
    productId: "plan_unlimited_20gb",
    marketCode: "ZA",
    productType: "PLAN",
    name: "Unlimited 20GB",
    priceOnceOff: 0,
    priceRecurring: 799.0,
    currencyCode: "ZAR",
    availabilityStatus: "IN_STOCK",
    badges: ["5G"],
    imageUrl: "https://cdn.example.com/plan-unlimited-hires.jpg",
    promoVideoUrl: null,
    alternateImages: [],
  },
  {
    productId: "prod_sim_tz_basic",
    marketCode: "TZ",
    productType: "SIM",
    name: "Basic SIM – Tanzania",
    priceOnceOff: 5000,
    priceRecurring: 0,
    currencyCode: "TZS",
    availabilityStatus: "IN_STOCK",
    badges: [],
    imageUrl: "https://cdn.example.com/sim-tz-hires.jpg",
    promoVideoUrl: null,
    alternateImages: [],
  },
  {
    productId: "prod_device_samsung_a54",
    marketCode: "EG",
    productType: "DEVICE",
    name: "Samsung Galaxy A54",
    priceOnceOff: 9999.0,
    priceRecurring: 0,
    currencyCode: "EGP",
    availabilityStatus: "IN_STOCK",
    badges: ["5G"],
    imageUrl: "https://cdn.example.com/samsung-a54-hires.jpg",
    promoVideoUrl: null,
    alternateImages: [],
  },
];

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly rows: CatalogRow[];

  constructor(rows: CatalogRow[] = SEED) {
    this.rows = rows;
  }

  async findByMarket(marketCode: string): Promise<CatalogRow[]> {
    return this.rows.filter((r) => r.marketCode === marketCode);
  }
}
