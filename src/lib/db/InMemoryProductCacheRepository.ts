import { PRODUCT_CACHE_SEED, ProductCacheSeedRow } from "@/lib/db/seeds/product-cache-seed";

export interface CatalogFilter {
  category?: string;
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  storage?: number[];
  availability?: string;
}

export interface ProductCacheRepository {
  findByMarket(marketCode: string, filter?: CatalogFilter): Promise<ProductCacheSeedRow[]>;
}

export class InMemoryProductCacheRepository implements ProductCacheRepository {
  private readonly records: ProductCacheSeedRow[];

  constructor(rows: ProductCacheSeedRow[] = PRODUCT_CACHE_SEED) {
    this.records = rows;
  }

  async findByMarket(marketCode: string, filter: CatalogFilter = {}): Promise<ProductCacheSeedRow[]> {
    return this.records.filter((r) => {
      if (r.marketCode !== marketCode) return false;

      if (filter.category && r.productType.toLowerCase() !== filter.category.toLowerCase()) {
        return false;
      }

      if (filter.brand && filter.brand.length > 0) {
        const brands = filter.brand.map((b) => b.toLowerCase());
        if (!brands.includes(r.metadataJson.brand.toLowerCase())) return false;
      }

      if (filter.priceMin !== undefined && r.priceOnceOff < filter.priceMin) return false;
      if (filter.priceMax !== undefined && r.priceOnceOff > filter.priceMax) return false;

      if (filter.storage && filter.storage.length > 0) {
        if (!filter.storage.includes(r.metadataJson.storageGb)) return false;
      }

      if (filter.availability) {
        const statusMap: Record<string, string> = {
          "in-stock": "IN_STOCK",
          "pre-order": "PRE_ORDER",
        };
        const mapped = statusMap[filter.availability] ?? filter.availability.toUpperCase();
        if (r.availabilityStatus !== mapped) return false;
      }

      return true;
    });
  }
}
