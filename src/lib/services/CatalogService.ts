export interface CatalogFragment {
  category: string;
  marketCode: string;
  products: Array<{ id: string; name: string; priceOnceOff: number }>;
}

export interface CatalogAdapter {
  fetchByCategory(marketCode: string, category: string): Promise<CatalogFragment>;
}

export interface CatalogLogger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
}

interface CacheEntry {
  value: CatalogFragment;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export class CatalogService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(
    private readonly adapter: CatalogAdapter,
    private readonly logger?: CatalogLogger
  ) {
    const envTtl = process.env["CATALOG_FRAGMENT_TTL_MS"];
    this.ttlMs = envTtl ? parseInt(envTtl, 10) : DEFAULT_TTL_MS;
  }

  async getCatalogFragment(marketCode: string, category: string): Promise<CatalogFragment> {
    const key = `${marketCode}::${category}`;
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached !== undefined && now < cached.expiresAt) {
      this.logger?.info({ event: "catalog.cache.hit", marketCode, category });
      return cached.value;
    }

    const value = await this.adapter.fetchByCategory(marketCode, category);
    this.cache.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }
}
