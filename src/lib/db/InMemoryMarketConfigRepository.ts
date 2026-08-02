import type { MarketConfig, MarketConfigRepository } from "@/lib/services/MarketContextService";
import { MARKET_CONFIG_SEED } from "@/lib/db/seeds/market-config-seed";

export class InMemoryMarketConfigRepository implements MarketConfigRepository {
  private readonly records: Map<string, MarketConfig>;

  constructor(rows: MarketConfig[] = MARKET_CONFIG_SEED) {
    this.records = new Map(rows.map((r) => [r.marketCode, r]));
  }

  async findByCode(marketCode: string): Promise<MarketConfig | null> {
    return this.records.get(marketCode) ?? null;
  }

  async findAll(): Promise<MarketConfig[]> {
    return Array.from(this.records.values());
  }
}
