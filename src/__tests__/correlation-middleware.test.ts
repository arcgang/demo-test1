/**
 * Acceptance tests: Correlation-ID middleware
 *
 * These tests MUST FAIL until the middleware is implemented at
 * src/lib/middleware/correlationId.ts (or equivalent path).
 *
 * Acceptance criteria:
 *   1. When no X-Correlation-ID header is present, the middleware generates a
 *      fresh UUID and attaches it to the async context and outbound response.
 *   2. When an X-Correlation-ID header is already present on the inbound
 *      request, the same value is preserved and echoed in the response.
 *   3. The correlation ID accessor (`getCorrelationId()`) returns the value
 *      bound to the current async context.
 *   4. The middleware exposes the correlation ID on the `X-Correlation-ID`
 *      response header.
 *
 * Tests run in the Node environment (see jest.config.js) so that the Web
 * Fetch globals (Request, Response, Headers) and Node's AsyncLocalStorage
 * are both available.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  correlationIdMiddleware,
  getCorrelationId,
} from "@/lib/middleware/correlationId";

// ── UUID helpers ──────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest("http://localhost/api/test");
  Object.entries(headers).forEach(([k, v]) =>
    (req.headers as unknown as Headers).set(k, v)
  );
  return req;
}

// ── ID generation when header is absent ───────────────────────────────────────

describe("correlationIdMiddleware – generates ID when none supplied", () => {
  it("returns a NextResponse (does not throw)", async () => {
    const req = makeRequest();
    await expect(
      correlationIdMiddleware(req, async () => NextResponse.next())
    ).resolves.toBeInstanceOf(NextResponse);
  });

  it("sets X-Correlation-ID on the response when none was on the request", async () => {
    const req = makeRequest();
    let responseCorrelationId: string | null = null;

    await correlationIdMiddleware(req, async () => {
      const res = NextResponse.next();
      responseCorrelationId = res.headers.get("X-Correlation-ID");
      return res;
    });

    // The middleware must write it onto the response before returning.
    const res = await correlationIdMiddleware(
      makeRequest(),
      async () => NextResponse.next()
    );
    const id = res.headers.get("X-Correlation-ID");
    expect(id).not.toBeNull();
    expect(UUID_RE.test(id!)).toBe(true);
  });

  it("generated ID is a valid UUID v4 string", async () => {
    const res = await correlationIdMiddleware(
      makeRequest(),
      async () => NextResponse.next()
    );
    const id = res.headers.get("X-Correlation-ID");
    expect(id).toMatch(UUID_RE);
  });

  it("generates a different ID on each request (not a constant)", async () => {
    const res1 = await correlationIdMiddleware(
      makeRequest(),
      async () => NextResponse.next()
    );
    const res2 = await correlationIdMiddleware(
      makeRequest(),
      async () => NextResponse.next()
    );
    expect(res1.headers.get("X-Correlation-ID")).not.toBe(
      res2.headers.get("X-Correlation-ID")
    );
  });
});

// ── ID forwarding when header is present ──────────────────────────────────────

describe("correlationIdMiddleware – preserves supplied X-Correlation-ID", () => {
  const SUPPLIED_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("echoes the supplied ID on the response header", async () => {
    const req = makeRequest({ "X-Correlation-ID": SUPPLIED_ID });
    const res = await correlationIdMiddleware(
      req,
      async () => NextResponse.next()
    );
    expect(res.headers.get("X-Correlation-ID")).toBe(SUPPLIED_ID);
  });

  it("does not replace a valid supplied ID with a new UUID", async () => {
    const req = makeRequest({ "X-Correlation-ID": SUPPLIED_ID });
    const res = await correlationIdMiddleware(
      req,
      async () => NextResponse.next()
    );
    expect(res.headers.get("X-Correlation-ID")).toBe(SUPPLIED_ID);
  });

  it("case-insensitive: lower-case x-correlation-id header is also forwarded", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-correlation-id": SUPPLIED_ID },
    });
    const res = await correlationIdMiddleware(
      req,
      async () => NextResponse.next()
    );
    expect(res.headers.get("X-Correlation-ID")).toBe(SUPPLIED_ID);
  });
});

// ── Async-context accessor ────────────────────────────────────────────────────

describe("correlationIdMiddleware – getCorrelationId() within handler context", () => {
  it("getCorrelationId() returns the same ID that appears on the response header", async () => {
    let idFromContext: string | null | undefined;

    const res = await correlationIdMiddleware(makeRequest(), async () => {
      idFromContext = getCorrelationId();
      return NextResponse.next();
    });

    const idFromHeader = res.headers.get("X-Correlation-ID");
    expect(idFromContext).toBeDefined();
    expect(idFromContext).not.toBeNull();
    expect(idFromContext).toBe(idFromHeader);
  });

  it("getCorrelationId() preserves a forwarded ID inside the handler", async () => {
    const SUPPLIED_ID = "11111111-2222-3333-4444-555555555555";
    let idFromContext: string | null | undefined;

    await correlationIdMiddleware(
      makeRequest({ "X-Correlation-ID": SUPPLIED_ID }),
      async () => {
        idFromContext = getCorrelationId();
        return NextResponse.next();
      }
    );

    expect(idFromContext).toBe(SUPPLIED_ID);
  });

  it("getCorrelationId() outside a middleware context returns null or undefined", () => {
    // Without an active AsyncLocalStorage context the accessor must not throw.
    const id = getCorrelationId();
    expect(id == null).toBe(true);
  });
});
