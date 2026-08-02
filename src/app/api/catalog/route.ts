import { NextRequest, NextResponse } from "next/server";
import { InMemoryMarketConfigRepository } from "@/lib/db/InMemoryMarketConfigRepository";
import { MarketContextService } from "@/lib/services/MarketContextService";
import { InMemorySimEsimCatalogRepository } from "@/lib/db/InMemorySimEsimCatalogRepository";

const marketRepo = new InMemoryMarketConfigRepository();
const marketService = new MarketContextService(marketRepo);
const simEsimRepo = new InMemorySimEsimCatalogRepository();

function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(data, init);
  const original = res.json.bind(res);
  let cached: Promise<unknown> | undefined;
  (res as NextResponse & { json: () => Promise<unknown> }).json = () => {
    if (!cached) cached = original();
    return cached;
  };
  return res;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const market = searchParams.get("market");
  const category = searchParams.get("category");

  if (!market) {
    return jsonResponse(
      {
        error: "MISSING_MARKET",
        message: "Query parameter 'market' is required.",
      },
      { status: 400 }
    );
  }

  const marketConfig = await marketService.getMarket(market);
  if (!marketConfig) {
    return jsonResponse(
      {
        error: "MARKET_NOT_FOUND",
        message: `Market '${market}' is not supported.`,
      },
      { status: 404 }
    );
  }

  if (category === "sim-esim") {
    const offers = simEsimRepo.findByMarket(market);
    return jsonResponse({ offers });
  }

  return jsonResponse({ offers: [] });
}
