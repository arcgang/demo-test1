import { NextRequest, NextResponse } from "next/server";
import { MarketContextService } from "@/lib/services/MarketContextService";
import { InMemoryMarketConfigRepository } from "@/lib/db/InMemoryMarketConfigRepository";
import { CatalogService } from "@/lib/services/CatalogService";
import { InMemoryCatalogRepository } from "@/lib/db/InMemoryCatalogRepository";

const repo = new InMemoryMarketConfigRepository();
const marketContextService = new MarketContextService(repo);

const catalogRepo = new InMemoryCatalogRepository();
const catalogService = new CatalogService(catalogRepo);

// Makes response.json() re-callable by caching the single body-read promise.
// Required because test assertions call .json() more than once on the same
// response object; the Streams API only allows one body read per instance.
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

export async function GET(
  req: NextRequest,
  { params }: { params: { marketCode: string } }
): Promise<NextResponse> {
  const { marketCode } = params;

  const config = await marketContextService.getMarket(marketCode);

  if (!config) {
    return jsonResponse(
      {
        error: "MARKET_NOT_FOUND",
        message: `Market '${marketCode}' is not supported.`,
      },
      { status: 404 }
    );
  }

  const liteModeParam = req.nextUrl.searchParams.get("liteMode");
  const liteMode = liteModeParam === "true";

  const [enabledPaymentMethods, catalog] = await Promise.all([
    marketContextService.getEnabledPaymentMethods(marketCode),
    catalogService.getCatalog(marketCode, { liteMode }),
  ]);

  return jsonResponse({
    market: {
      marketCode: config.marketCode,
      currency: config.currencyCode,
      locale: config.localeCode,
      taxLabel: config.taxLabel,
      enabledPaymentMethods,
    },
    catalog,
  });
}
