/**
 * TMF620 Product Catalog Management — adapter interface (NFR-32)
 *
 * Represents the TM Forum TMF620 Product Catalog Management resource model.
 * Provides access to localized products, offers, bundles, SIM/eSIM offers, and
 * service plans filtered by MarketContext. Mock implementations must be
 * replaceable without touching domain service logic (IR-04).
 */

/** Market scoping context passed to all catalog queries. */
export interface MarketContext {
  marketCode: string;
}

/** Pricing shape shared across catalog items. */
export interface ProductPrice {
  onceOff?: number;
  recurring?: number;
  currency: string;
}

/** A single product entry returned from the catalog (TMF620 ProductOffering). */
export interface CatalogProduct {
  productId: string;
  productType: "DEVICE" | "SIM" | "ESIM" | "PLAN" | "ACCESSORY" | string;
  name: string;
  price: ProductPrice;
  availabilityStatus?: string;
  marketCode?: string;
  badges?: string[];
  availableAttachments?: string[];
}

/** A product offer grouping one or more products (TMF620 ProductOffering). */
export interface ProductOffer {
  offerId: string;
  name: string;
  products: string[];
  marketCode?: string;
}

/** A product bundle composed of multiple components (TMF620 BundledProductOffering). */
export interface ProductBundle {
  bundleId: string;
  name: string;
  components: string[];
  marketCode?: string;
}

/** A SIM or eSIM offer (TMF620 ProductOffering specialisation). */
export interface SIMOffer {
  simOfferId: string;
  simType: "SIM" | "ESIM";
  name: string;
  marketCode?: string;
}

/** A service plan with recurring pricing (TMF620 ProductOffering — PLAN type). */
export interface ServicePlan {
  planId: string;
  name: string;
  price: { recurring: number; currency: string };
  marketCode?: string;
}

/**
 * TMF620 ProductCatalogAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface ProductCatalogAdapter {
  /** Return all products available in the given market. */
  listProducts(context: MarketContext): Promise<CatalogProduct[]>;

  /** Return a single product by ID scoped to the given market, or null if not found. */
  getProduct(productId: string, context: MarketContext): Promise<CatalogProduct | null>;

  /** Return all product offers available in the given market. */
  listOffers(context: MarketContext): Promise<ProductOffer[]>;

  /** Return all product bundles available in the given market. */
  listBundles(context: MarketContext): Promise<ProductBundle[]>;

  /** Return SIM and eSIM offers available in the given market. */
  listSIMOffers(context: MarketContext): Promise<SIMOffer[]>;

  /** Return service plans filtered by the given market context. */
  listPlans(context: MarketContext): Promise<ServicePlan[]>;
}
