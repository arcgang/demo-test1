import { AsyncLocalStorage } from "async_hooks";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const storage = new AsyncLocalStorage<string>();

export function getCorrelationId(): string | undefined {
  return storage.getStore();
}

export async function correlationIdMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const correlationId =
    req.headers.get("x-correlation-id") ?? randomUUID();

  const res = await storage.run(correlationId, () => handler(req));
  res.headers.set("X-Correlation-ID", correlationId);
  return res;
}
