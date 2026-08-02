import { getCorrelationId } from "@/lib/middleware/correlationId";

type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogMeta {
  orderRef?: string;
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
}

function emit(service: string, level: LogLevel, message: string, meta?: LogMeta): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    correlationId: getCorrelationId() ?? null,
  };

  if (meta?.orderRef !== undefined) {
    entry.orderRef = meta.orderRef;
  }

  process.stdout.write(JSON.stringify(entry) + "\n");
}

export function createLogger(service: string): Logger {
  return {
    info: (message, meta) => emit(service, "info", message, meta),
    warn: (message, meta) => emit(service, "warn", message, meta),
    error: (message, meta) => emit(service, "error", message, meta),
    debug: (message, meta) => emit(service, "debug", message, meta),
  };
}
