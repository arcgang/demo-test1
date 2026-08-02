export interface MarketConfig {
  marketCode: string;
  marketName: string;
  localeCode: string;
  currencyCode: string;
  taxLabel: string;
  mobileMoneyEnabled: boolean;
  cardPaymentEnabled: boolean;
  liteModeDefault: boolean;
}

export interface MarketConfigRepository {
  findByCode(marketCode: string): Promise<MarketConfig | null>;
  findAll(): Promise<MarketConfig[]>;
}

interface CacheEntry {
  value: MarketConfig | null;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class MarketContextService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(private readonly repo: MarketConfigRepository) {
    const envTtl = process.env["MARKET_CONFIG_TTL_MS"];
    this.ttlMs = envTtl ? parseInt(envTtl, 10) : DEFAULT_TTL_MS;
  }

  async getMarket(marketCode: string): Promise<MarketConfig | null> {
    const now = Date.now();
    const cached = this.cache.get(marketCode);
    if (cached !== undefined && now < cached.expiresAt) {
      return cached.value;
    }

    const value = await this.repo.findByCode(marketCode);
    this.cache.set(marketCode, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  async getEnabledPaymentMethods(marketCode: string): Promise<string[]> {
    const config = await this.getMarket(marketCode);
    if (!config) return [];
    const methods: string[] = [];
    if (config.cardPaymentEnabled) methods.push("CARD_TOKEN");
    if (config.mobileMoneyEnabled) methods.push("MOBILE_MONEY");
    return methods;
  }

  async isMarketSupported(marketCode: string): Promise<boolean> {
    const config = await this.getMarket(marketCode);
    return config !== null;
  }
}
