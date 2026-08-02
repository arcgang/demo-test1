/**
 * CatalogService — localized product catalog retrieval with optional lite-mode projection.
 *
 * liteMode omits high-bandwidth media fields:
 *   - imageUrl          (high-resolution product image URL)
 *   - promoVideoUrl     (promotional video URL, may be null)
 *   - alternateImages   (additional angle/color image URL array)
 *
 * Fields retained in both full and lite payloads:
 *   productId, productType, name, price (onceOff, currency),
 *   badges, availabilityStatus, href (/product/{productId})
 */

export interface CatalogRow {
  productId: string;
  marketCode: string;
  productType: string;
  name: string;
  priceOnceOff: number;
  priceRecurring: number;
  currencyCode: string;
  availabilityStatus: string;
  badges: string[];
  imageUrl: string;
  promoVideoUrl: string | null;
  alternateImages: string[];
}

export interface CatalogRepository {
  findByMarket(marketCode: string): Promise<CatalogRow[]>;
}

export interface CatalogItem {
  productId: string;
  productType: string;
  name: string;
  price: { onceOff: number; currency: string };
  badges: string[];
  availabilityStatus: string;
  href: string;
  imageUrl?: string;
  promoVideoUrl?: string | null;
  alternateImages?: string[];
}

export interface CatalogOptions {
  liteMode?: boolean;
}

export class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  async getCatalog(
    marketCode: string,
    options?: CatalogOptions
  ): Promise<CatalogItem[]> {
    const rows = await this.repo.findByMarket(marketCode);
    const liteMode = options?.liteMode === true;
    return rows.map((row) => this.toItem(row, liteMode));
  }

  private toItem(row: CatalogRow, liteMode: boolean): CatalogItem {
    const base = {
      productId: row.productId,
      productType: row.productType,
      name: row.name,
      price: { onceOff: row.priceOnceOff, currency: row.currencyCode },
      badges: row.badges,
      availabilityStatus: row.availabilityStatus,
      href: `/product/${row.productId}`,
    };

    if (liteMode) {
      return base;
    }

    return {
      ...base,
      imageUrl: row.imageUrl,
      promoVideoUrl: row.promoVideoUrl,
      alternateImages: row.alternateImages,
    };
  }
}
