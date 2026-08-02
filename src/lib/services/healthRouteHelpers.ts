import {
  HealthService,
  CatalogDependencyChecker,
  PaymentDependencyChecker,
  EligibilityDependencyChecker,
  ActivationDependencyChecker,
  type DependencyStatus,
  type HealthStatus,
} from "@/lib/services/HealthService";

export const noop = (): Promise<void> => Promise.resolve();

export function buildDefaultService(): HealthService {
  return new HealthService([
    new CatalogDependencyChecker({ probe: noop }),
    new PaymentDependencyChecker({ probe: noop }),
    new EligibilityDependencyChecker({ probe: noop }),
    new ActivationDependencyChecker({ probe: noop }),
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
