/**
 * Acceptance tests: Structured JSON logger
 *
 * These tests MUST FAIL until the logger is implemented at
 * src/lib/logger/index.ts (or equivalent path).
 *
 * Acceptance criteria:
 *   1. `createLogger(service)` returns a logger with at least info, warn,
 *      error, and debug methods.
 *   2. Every emitted log line is valid JSON.
 *   3. Every log line contains the required fields:
 *        timestamp  — ISO-8601 string
 *        level      — "info" | "warn" | "error" | "debug" (etc.)
 *        service    — the value passed to createLogger
 *        message    — the logged message string
 *        correlationId — present when getCorrelationId() is non-null (may be
 *                        null/undefined when called outside a middleware context)
 *   4. When `orderRef` is included in the log meta, it appears in the output.
 *   5. Log output goes to stdout (or a writable stream the tests can capture),
 *      not stderr, for structured log pipelines.
 *
 * Tests run in the jsdom environment alongside other service-layer tests.
 */

import { createLogger } from "@/lib/logger";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Capture a single synchronous log write by temporarily replacing process.stdout.write */
function captureLogLine(fn: () => void): unknown {
  const lines: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);
  (process.stdout as NodeJS.WriteStream).write = (
    chunk: string | Uint8Array,
    ...rest: unknown[]
  ): boolean => {
    if (typeof chunk === "string") lines.push(chunk);
    return true;
  };
  try {
    fn();
  } finally {
    (process.stdout as NodeJS.WriteStream).write = originalWrite as typeof process.stdout.write;
  }
  // Return the last non-empty line (loggers may append \n)
  const raw = lines
    .join("")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .pop();
  if (!raw) return null;
  return JSON.parse(raw);
}

// ── Logger creation ───────────────────────────────────────────────────────────

describe("createLogger – factory", () => {
  it("createLogger returns an object without throwing", () => {
    expect(() => createLogger("test-service")).not.toThrow();
  });

  it("returned logger has an 'info' method", () => {
    const logger = createLogger("test-service");
    expect(typeof logger.info).toBe("function");
  });

  it("returned logger has a 'warn' method", () => {
    const logger = createLogger("test-service");
    expect(typeof logger.warn).toBe("function");
  });

  it("returned logger has an 'error' method", () => {
    const logger = createLogger("test-service");
    expect(typeof logger.error).toBe("function");
  });

  it("returned logger has a 'debug' method", () => {
    const logger = createLogger("test-service");
    expect(typeof logger.debug).toBe("function");
  });
});

// ── Valid JSON output ─────────────────────────────────────────────────────────

describe("structured logger – emits valid JSON", () => {
  it("logger.info emits valid JSON to stdout", () => {
    const logger = createLogger("catalog-service");
    expect(() =>
      captureLogLine(() => logger.info("test message"))
    ).not.toThrow();

    const line = captureLogLine(() => logger.info("test message"));
    expect(line).not.toBeNull();
    expect(typeof line).toBe("object");
  });

  it("logger.warn emits valid JSON to stdout", () => {
    const logger = createLogger("catalog-service");
    const line = captureLogLine(() => logger.warn("warn message"));
    expect(line).not.toBeNull();
    expect(typeof line).toBe("object");
  });

  it("logger.error emits valid JSON to stdout", () => {
    const logger = createLogger("catalog-service");
    const line = captureLogLine(() => logger.error("error message"));
    expect(line).not.toBeNull();
    expect(typeof line).toBe("object");
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("structured logger – required fields present in every line", () => {
  it("log line contains 'timestamp' field", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("order created")
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("timestamp");
    expect(typeof line.timestamp).toBe("string");
    expect((line.timestamp as string).trim().length).toBeGreaterThan(0);
  });

  it("timestamp is a parseable ISO-8601 date string", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("order created")
    ) as Record<string, unknown>;
    const parsed = Date.parse(line.timestamp as string);
    expect(isNaN(parsed)).toBe(false);
  });

  it("log line contains 'level' field", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("some message")
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("level");
    expect(typeof line.level).toBe("string");
  });

  it("level field equals 'info' for logger.info calls", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("info message")
    ) as Record<string, unknown>;
    expect((line.level as string).toLowerCase()).toBe("info");
  });

  it("level field equals 'warn' for logger.warn calls", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.warn("warn message")
    ) as Record<string, unknown>;
    expect((line.level as string).toLowerCase()).toBe("warn");
  });

  it("level field equals 'error' for logger.error calls", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.error("error message")
    ) as Record<string, unknown>;
    expect((line.level as string).toLowerCase()).toBe("error");
  });

  it("log line contains 'service' field matching createLogger argument", () => {
    const logger = createLogger("payment-service");
    const line = captureLogLine(() =>
      logger.info("payment initiated")
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("service");
    expect(line.service).toBe("payment-service");
  });

  it("different service names produce different 'service' field values", () => {
    const loggerA = createLogger("service-a");
    const loggerB = createLogger("service-b");
    const lineA = captureLogLine(() =>
      loggerA.info("msg")
    ) as Record<string, unknown>;
    const lineB = captureLogLine(() =>
      loggerB.info("msg")
    ) as Record<string, unknown>;
    expect(lineA.service).toBe("service-a");
    expect(lineB.service).toBe("service-b");
  });

  it("log line contains 'message' field with the logged string", () => {
    const logger = createLogger("catalog-service");
    const line = captureLogLine(() =>
      logger.info("catalog fetched successfully")
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("message");
    expect(line.message).toBe("catalog fetched successfully");
  });

  it("log line contains 'correlationId' key (value may be null outside middleware context)", () => {
    const logger = createLogger("catalog-service");
    const line = captureLogLine(() =>
      logger.info("some event")
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("correlationId");
  });
});

// ── Optional orderRef field ───────────────────────────────────────────────────

describe("structured logger – orderRef field", () => {
  it("orderRef appears in the log line when supplied in meta", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("order confirmed", { orderRef: "ord_3001" })
    ) as Record<string, unknown>;
    expect(line).toHaveProperty("orderRef");
    expect(line.orderRef).toBe("ord_3001");
  });

  it("log line without orderRef in meta does not include orderRef key (or it is null/undefined)", () => {
    const logger = createLogger("order-service");
    const line = captureLogLine(() =>
      logger.info("catalog fetched")
    ) as Record<string, unknown>;
    // orderRef should be absent or explicitly null — never a stale value
    const hasKey = Object.prototype.hasOwnProperty.call(line, "orderRef");
    if (hasKey) {
      expect(line.orderRef == null).toBe(true);
    } else {
      expect(hasKey).toBe(false);
    }
  });

  it("orderRef from meta does not bleed across separate log calls", () => {
    const logger = createLogger("order-service");
    captureLogLine(() => logger.info("first", { orderRef: "ord_9999" }));
    const second = captureLogLine(() =>
      logger.info("second")
    ) as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(second, "orderRef")) {
      expect(second.orderRef == null).toBe(true);
    }
  });
});

// ── correlationId in log output when set via async context ───────────────────

describe("structured logger – correlationId from async context", () => {
  it("correlationId is null or undefined when called outside middleware context", () => {
    const logger = createLogger("catalog-service");
    const line = captureLogLine(() =>
      logger.info("outside context")
    ) as Record<string, unknown>;
    // Either the key is absent or its value is null/undefined
    const val = line.correlationId;
    expect(val == null).toBe(true);
  });
});
