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

export class MarketContextService {
  constructor(private readonly repo: MarketConfigRepository) {}

  async getMarket(marketCode: string): Promise<MarketConfig | null> {
    return this.repo.findByCode(marketCode);
  }

  async getEnabledPaymentMethods(marketCode: string): Promise<string[]> {
    const config = await this.repo.findByCode(marketCode);
    if (!config) return [];
    const methods: string[] = [];
    if (config.cardPaymentEnabled) methods.push("CARD_TOKEN");
    if (config.mobileMoneyEnabled) methods.push("MOBILE_MONEY");
    return methods;
  }

  async isMarketSupported(marketCode: string): Promise<boolean> {
    const config = await this.repo.findByCode(marketCode);
    return config !== null;
  }
}
