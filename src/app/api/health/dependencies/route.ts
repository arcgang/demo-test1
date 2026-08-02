import { NextRequest, NextResponse } from "next/server";
import { runChecksWithOverrides } from "@/lib/services/healthRouteHelpers";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { results, httpStatus } = await runChecksWithOverrides(req);
  return NextResponse.json(results, { status: httpStatus });
}
