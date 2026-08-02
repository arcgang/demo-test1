import { NextRequest, NextResponse } from "next/server";
import { MarketContextService } from "@/lib/services/MarketContextService";
import { InMemoryMarketConfigRepository } from "@/lib/db/InMemoryMarketConfigRepository";
import { CatalogService } from "@/lib/services/CatalogService";
import { InMemoryProductCacheRepository } from "@/lib/db/InMemoryProductCacheRepository";

const marketRepo = new InMemoryMarketConfigRepository();
const marketContextService = new MarketContextService(marketRepo);
const productRepo = new InMemoryProductCacheRepository();
const catalogService = new CatalogService(productRepo);

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

function parseCommaSeparated(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parseCommaSeparatedNumbers(value: string | null): number[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return parts.length > 0 ? parts : undefined;
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

  const enabledPaymentMethods = await marketContextService.getEnabledPaymentMethods(marketCode);

  const sp = req.nextUrl.searchParams;
  const rawPage = parseInt(sp.get("page") ?? "1", 10);
  const rawPageSize = parseInt(sp.get("pageSize") ?? "12", 10);

  const { items, pagination } = await catalogService.getCatalogPage(marketCode, {
    category: sp.get("category") ?? undefined,
    brand: parseCommaSeparated(sp.get("brand")),
    priceMin: sp.get("priceMin") ? parseFloat(sp.get("priceMin")!) : undefined,
    priceMax: sp.get("priceMax") ? parseFloat(sp.get("priceMax")!) : undefined,
    storage: parseCommaSeparatedNumbers(sp.get("storage")),
    availability: sp.get("availability") ?? undefined,
    page: isNaN(rawPage) ? 1 : rawPage,
    pageSize: isNaN(rawPageSize) ? 12 : rawPageSize,
    currency: config.currencyCode,
  });

  return jsonResponse({
    market: {
      marketCode: config.marketCode,
      currency: config.currencyCode,
      locale: config.localeCode,
      taxLabel: config.taxLabel,
      enabledPaymentMethods,
    },
    catalog: items,
    pagination,
  });
}
