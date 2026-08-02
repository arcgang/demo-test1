import { NextRequest, NextResponse } from "next/server";
import { MarketContextService } from "@/lib/services/MarketContextService";
import { InMemoryMarketConfigRepository } from "@/lib/db/InMemoryMarketConfigRepository";

const repo = new InMemoryMarketConfigRepository();
const marketContextService = new MarketContextService(repo);

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
  _req: NextRequest,
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

  const enabledPaymentMethods =
    await marketContextService.getEnabledPaymentMethods(marketCode);

  return jsonResponse({
    market: {
      marketCode: config.marketCode,
      currency: config.currencyCode,
      locale: config.localeCode,
      taxLabel: config.taxLabel,
      enabledPaymentMethods,
    },
    catalog: [],
  });
}
