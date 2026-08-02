import { NextRequest, NextResponse } from "next/server";
import { runChecksWithOverrides } from "@/lib/services/healthRouteHelpers";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { results, aggregateStatus, httpStatus } =
    await runChecksWithOverrides(req);

  return NextResponse.json(
    {
      status: aggregateStatus,
      checkedAt: new Date().toISOString(),
      dependencies: results,
    },
    { status: httpStatus }
  );
}
