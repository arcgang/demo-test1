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
  warnThresholdMs?: number;
}

async function runProbe(
  name: string,
  probe: () => Promise<void>,
  timeoutMs: number,
  warnThresholdMs?: number
): Promise<DependencyStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      probe(),
      new Promise<never>((_, reject) => {
        timerId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]).finally(() => clearTimeout(timerId));
    const latencyMs = Date.now() - start;
    const status: HealthStatus =
      warnThresholdMs !== undefined && latencyMs >= warnThresholdMs
        ? "degraded"
        : "up";
    return { name, status, latencyMs, checkedAt };
  } catch {
    return { name, status: "down", latencyMs: Date.now() - start, checkedAt };
  }
}

export class GenericDependencyChecker implements DependencyChecker {
  readonly name: string;
  private readonly probe: () => Promise<void>;
  private readonly timeoutMs: number;
  private readonly warnThresholdMs?: number;

  constructor(
    name: string,
    { probe, timeoutMs = 2000, warnThresholdMs }: CheckerOptions
  ) {
    this.name = name;
    this.probe = probe;
    this.timeoutMs = timeoutMs;
    this.warnThresholdMs = warnThresholdMs;
  }

  check(): Promise<DependencyStatus> {
    return runProbe(this.name, this.probe, this.timeoutMs, this.warnThresholdMs);
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
    return results.every((r) => r.status !== "down");
  }
}
