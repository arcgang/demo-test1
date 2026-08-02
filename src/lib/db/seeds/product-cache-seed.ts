export interface ProductMetadata {
  brand: string;
  storageGb: number;
  badges: string[];
  eligibilityHint: string;
  availableAttachments: string[];
}

export interface ProductCacheSeedRow {
  productId: string;
  marketCode: string;
  productType: string;
  name: string;
  priceOnceOff: number;
  priceRecurring: number;
  availabilityStatus: string;
  metadataJson: ProductMetadata;
}

export const PRODUCT_CACHE_SEED: ProductCacheSeedRow[] = [
  {
    productId: "prod_device_iphone15pro",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "iPhone 15 Pro 256GB",
    priceOnceOff: 24999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Apple",
      storageGb: 256,
      badges: ["5G", "Trade-In Eligible"],
      eligibilityHint: "UPGRADE_ELIGIBLE",
      availableAttachments: ["plan_unlimited_20gb", "bundle_weekend_max"],
    },
  },
  {
    productId: "prod_device_s24ultra",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "Samsung Galaxy S24 Ultra 256GB",
    priceOnceOff: 22999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Samsung",
      storageGb: 256,
      badges: ["5G"],
      eligibilityHint: "UPGRADE_ELIGIBLE",
      availableAttachments: ["plan_unlimited_20gb", "bundle_weekend_max"],
    },
  },
  {
    productId: "prod_device_iphone15",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "iPhone 15 128GB",
    priceOnceOff: 18999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Apple",
      storageGb: 128,
      badges: ["5G", "Trade-In Eligible"],
      eligibilityHint: "UPGRADE_ELIGIBLE",
      availableAttachments: ["plan_unlimited_20gb", "bundle_weekend_max"],
    },
  },
  {
    productId: "prod_device_s24",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "Samsung Galaxy S24 256GB",
    priceOnceOff: 16999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Samsung",
      storageGb: 256,
      badges: ["5G"],
      eligibilityHint: "UPGRADE_ELIGIBLE",
      availableAttachments: ["plan_unlimited_20gb", "bundle_weekend_max"],
    },
  },
  {
    productId: "prod_device_iphone14",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "iPhone 14 128GB",
    priceOnceOff: 15999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Apple",
      storageGb: 128,
      badges: ["5G", "Trade-In Eligible"],
      eligibilityHint: "UPGRADE_ELIGIBLE",
      availableAttachments: ["plan_unlimited_20gb", "bundle_weekend_max"],
    },
  },
  {
    productId: "prod_device_a54",
    marketCode: "ZA",
    productType: "DEVICE",
    name: "Samsung Galaxy A54 128GB",
    priceOnceOff: 8999,
    priceRecurring: 0,
    availabilityStatus: "IN_STOCK",
    metadataJson: {
      brand: "Samsung",
      storageGb: 128,
      badges: ["5G"],
      eligibilityHint: "STANDARD",
      availableAttachments: ["plan_unlimited_20gb"],
    },
  },
];
