import { NextRequest, NextResponse } from "next/server";
import {
  HealthService,
  CatalogDependencyChecker,
  PaymentDependencyChecker,
  EligibilityDependencyChecker,
  ActivationDependencyChecker,
  type DependencyStatus,
  type HealthStatus,
} from "@/lib/services/HealthService";

const noop = (): Promise<void> => Promise.resolve();

function buildDefaultService(): HealthService {
  return new HealthService([
    new CatalogDependencyChecker({ probe: noop }),
    new PaymentDependencyChecker({ probe: noop }),
    new EligibilityDependencyChecker({ probe: noop }),
    new ActivationDependencyChecker({ probe: noop }),
  ]);
}

function applyOverrides(
  results: DependencyStatus[],
  overrides: Record<string, string>
): DependencyStatus[] {
  return results.map((dep) => {
    const override = overrides[dep.name];
    if (override === "up" || override === "degraded" || override === "down") {
      return { ...dep, status: override as HealthStatus };
    }
    return dep;
  });
}

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

  const allUp = results.every((r) => r.status === "up");
  const httpStatus = allUp ? 200 : 503;

  return NextResponse.json(results, { status: httpStatus });
}
