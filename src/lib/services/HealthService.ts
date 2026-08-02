export type HealthStatus = "up" | "degraded" | "down";

export interface DependencyStatus {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  checkedAt: string;
}

export interface DependencyChecker {
  name: string;
  check(): Promise<DependencyStatus>;
}

export interface CheckerOptions {
  probe: () => Promise<void>;
  timeoutMs?: number;
}

async function runProbe(
  name: string,
  probe: () => Promise<void>,
  timeoutMs: number
): Promise<DependencyStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    await Promise.race([
      probe(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    return { name, status: "up", latencyMs: Date.now() - start, checkedAt };
  } catch {
    return { name, status: "down", latencyMs: Date.now() - start, checkedAt };
  }
}

export class CatalogDependencyChecker implements DependencyChecker {
  readonly name = "catalog";
  private readonly probe: () => Promise<void>;
  private readonly timeoutMs: number;

  constructor({ probe, timeoutMs = 2000 }: CheckerOptions) {
    this.probe = probe;
    this.timeoutMs = timeoutMs;
  }

  check(): Promise<DependencyStatus> {
    return runProbe(this.name, this.probe, this.timeoutMs);
  }
}

export class PaymentDependencyChecker implements DependencyChecker {
  readonly name = "payment";
  private readonly probe: () => Promise<void>;
  private readonly timeoutMs: number;

  constructor({ probe, timeoutMs = 2000 }: CheckerOptions) {
    this.probe = probe;
    this.timeoutMs = timeoutMs;
  }

  check(): Promise<DependencyStatus> {
    return runProbe(this.name, this.probe, this.timeoutMs);
  }
}

export class EligibilityDependencyChecker implements DependencyChecker {
  readonly name = "eligibility";
  private readonly probe: () => Promise<void>;
  private readonly timeoutMs: number;

  constructor({ probe, timeoutMs = 2000 }: CheckerOptions) {
    this.probe = probe;
    this.timeoutMs = timeoutMs;
  }

  check(): Promise<DependencyStatus> {
    return runProbe(this.name, this.probe, this.timeoutMs);
  }
}

export class ActivationDependencyChecker implements DependencyChecker {
  readonly name = "activation";
  private readonly probe: () => Promise<void>;
  private readonly timeoutMs: number;

  constructor({ probe, timeoutMs = 2000 }: CheckerOptions) {
    this.probe = probe;
    this.timeoutMs = timeoutMs;
  }

  check(): Promise<DependencyStatus> {
    return runProbe(this.name, this.probe, this.timeoutMs);
  }
}

export class HealthService {
  private readonly checkers: DependencyChecker[];

  constructor(checkers: DependencyChecker[]) {
    this.checkers = checkers;
  }

  async checkAll(): Promise<DependencyStatus[]> {
    return Promise.all(this.checkers.map((c) => c.check()));
  }

  async isHealthy(): Promise<boolean> {
    const results = await this.checkAll();
    return results.every((r) => r.status === "up");
  }
}
