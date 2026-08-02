import { SIM_ESIM_CATALOG_SEED, SimEsimOffer } from "@/lib/db/seeds/sim-esim-catalog-seed";

export class InMemorySimEsimCatalogRepository {
  private readonly records: Map<string, SimEsimOffer>;

  constructor(rows: SimEsimOffer[] = SIM_ESIM_CATALOG_SEED) {
    this.records = new Map(rows.map((r) => [r.offerId, r]));
  }

  findByMarket(marketCode: string): SimEsimOffer[] {
    return Array.from(this.records.values()).filter((o) =>
      o.marketAvailability.includes(marketCode)
    );
  }

  findById(offerId: string): SimEsimOffer | null {
    return this.records.get(offerId) ?? null;
  }
}
