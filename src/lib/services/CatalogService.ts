import type { ProductCacheRepository, CatalogFilter } from "@/lib/db/InMemoryProductCacheRepository";

export interface CatalogItem {
  productId: string;
  productType: string;
  name: string;
  price: {
    onceOff: number;
    monthlyFrom: number;
    currency: string;
  };
  eligibilityHint: string;
  availableAttachments: string[];
  badges: string[];
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface CatalogPage {
  items: CatalogItem[];
  pagination: PaginationMeta;
}

export interface CatalogQuery extends CatalogFilter {
  page?: number;
  pageSize?: number;
  currency?: string;
}

export class CatalogService {
  constructor(private readonly repo: ProductCacheRepository) {}

  async getCatalogPage(marketCode: string, query: CatalogQuery = {}): Promise<CatalogPage> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? 12);
    const currency = query.currency ?? "ZAR";

    const filter: CatalogFilter = {
      category: query.category,
      brand: query.brand,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      storage: query.storage,
      availability: query.availability,
    };

    const all = await this.repo.findByMarket(marketCode, filter);
    const totalItems = all.length;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const slice = all.slice(offset, offset + pageSize);

    const items: CatalogItem[] = slice.map((r) => ({
      productId: r.productId,
      productType: r.productType,
      name: r.name,
      price: {
        onceOff: r.priceOnceOff,
        monthlyFrom: r.priceRecurring,
        currency,
      },
      eligibilityHint: r.metadataJson.eligibilityHint,
      availableAttachments: r.metadataJson.availableAttachments,
      badges: r.metadataJson.badges,
    }));

    return {
      items,
      pagination: { currentPage: page, pageSize, totalPages, totalItems },
    };
  }
}
