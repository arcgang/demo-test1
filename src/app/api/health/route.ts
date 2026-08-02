import { NextRequest, NextResponse } from "next/server";
import {
  buildDefaultService,
  applyOverrides,
  worstStatus,
} from "@/lib/services/healthRouteHelpers";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const service = buildDefaultService();
  let results = await service.checkAll();

  const overrideHeader = req.headers.get("x-health-probe-override");
  if (overrideHeader) {
    try {
      const overrides = JSON.parse(overrideHeader) as Record<string, string>;
      results = applyOverrides(results, overrides);
    } catch {
      // malformed header — ignore
    }
  }

  const aggregateStatus = worstStatus(results);
  const httpStatus =
    aggregateStatus === "up" ? 200 : aggregateStatus === "degraded" ? 207 : 503;

  return NextResponse.json(
    {
      status: aggregateStatus,
      checkedAt: new Date().toISOString(),
      dependencies: results,
    },
    { status: httpStatus }
  );
}
