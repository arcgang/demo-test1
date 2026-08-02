import type { NextRequest } from "next/server";
import {
  HealthService,
  GenericDependencyChecker,
  type DependencyStatus,
  type HealthStatus,
} from "@/lib/services/HealthService";

export const noop = (): Promise<void> => Promise.resolve();

export function buildDefaultService(): HealthService {
  return new HealthService([
    new GenericDependencyChecker("catalog", { probe: noop }),
    new GenericDependencyChecker("payment", { probe: noop }),
    new GenericDependencyChecker("eligibility", { probe: noop }),
    new GenericDependencyChecker("activation", { probe: noop }),
  ]);
}

export function applyOverrides(
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

/** Returns the worst status across all results: down > degraded > up. */
export function worstStatus(results: DependencyStatus[]): HealthStatus {
  if (results.some((r) => r.status === "down")) return "down";
  if (results.some((r) => r.status === "degraded")) return "degraded";
  return "up";
}

export async function runChecksWithOverrides(req: NextRequest): Promise<{
  results: DependencyStatus[];
  aggregateStatus: HealthStatus;
  httpStatus: number;
}> {
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
  // Endpoint contract: HTTP 200 = all dependencies up; HTTP 503 = any dependency
  // degraded or down. Both non-up states signal that the service is not fully
  // operational and operators should investigate before routing traffic.
  const httpStatus = aggregateStatus === "up" ? 200 : 503;

  return { results, aggregateStatus, httpStatus };
}
