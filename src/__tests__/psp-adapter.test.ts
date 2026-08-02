/**
 * Acceptance tests for PSPAdapter (Payment Service Provider tokenized card adapter).
 *
 * Verifies the interface contract and the MockPSPAdapter deterministic behaviour
 * across:
 *  - happy-path tokenization, authorization, capture, and refund
 *  - authorization failure scenario
 *  - capture failure scenario
 *  - PCI-DSS: no raw PAN in any response
 */

import {
  type PSPAdapter,
  type TokenizeCardRequest,
  type TokenizeCardResult,
  type AuthorizePaymentRequest,
  type AuthorizePaymentResult,
  type CapturePaymentRequest,
  type CapturePaymentResult,
  type RefundPaymentRequest,
  type RefundPaymentResult,
  MockPSPAdapter,
} from "@/lib/adapters/PSPAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTokenizeRequest(overrides: Partial<TokenizeCardRequest> = {}): TokenizeCardRequest {
  return {
    pspSessionToken: "psp_session_abc",
    lastFour: "4242",
    expiryMonth: "12",
    expiryYear: "2028",
    cardholderName: "Test User",
    ...overrides,
  };
}

function makeAuthorizeRequest(overrides: Partial<AuthorizePaymentRequest> = {}): AuthorizePaymentRequest {
  return {
    tokenReference: "tok_visa_4242",
    amount: 18999.0,
    currencyCode: "ZAR",
    paymentAttemptId: "pay_501",
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockPSPAdapter – interface compliance", () => {
  it("exposes tokenizeCard, authorizePayment, capturePayment, and refundPayment", () => {
    const adapter: PSPAdapter = new MockPSPAdapter();
    expect(typeof adapter.tokenizeCard).toBe("function");
    expect(typeof adapter.authorizePayment).toBe("function");
    expect(typeof adapter.capturePayment).toBe("function");
    expect(typeof adapter.refundPayment).toBe("function");
  });
});

// ── tokenizeCard ──────────────────────────────────────────────────────────────

describe("MockPSPAdapter.tokenizeCard", () => {
  it("happy path: returns a non-empty tokenReference", async () => {
    const adapter = new MockPSPAdapter();
    const result: TokenizeCardResult = await adapter.tokenizeCard(makeTokenizeRequest());

    expect(result.tokenReference).toBeDefined();
    expect(result.tokenReference.length).toBeGreaterThan(0);
  });

  it("PCI-DSS: tokenReference does not contain raw PAN patterns", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.tokenizeCard(makeTokenizeRequest());
    expect(result.tokenReference).not.toMatch(/\b\d{16}\b/);
  });

  it("returns lastFour and masked card details in result", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.tokenizeCard(makeTokenizeRequest({ lastFour: "1234" }));
    expect(result.lastFour).toBe("1234");
  });

  it("includes tokenizedAt timestamp", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.tokenizeCard(makeTokenizeRequest());
    expect(result.tokenizedAt).toBeDefined();
    expect(new Date(result.tokenizedAt).getTime()).not.toBeNaN();
  });

  it("fail scenario: rejects when pspSessionToken contains 'fail'", async () => {
    const adapter = new MockPSPAdapter();
    await expect(
      adapter.tokenizeCard(makeTokenizeRequest({ pspSessionToken: "psp_fail_session" }))
    ).rejects.toBeDefined();
  });
});

// ── authorizePayment ──────────────────────────────────────────────────────────

describe("MockPSPAdapter.authorizePayment", () => {
  it("happy path: returns AUTHORIZED status for a valid token reference", async () => {
    const adapter = new MockPSPAdapter();
    const result: AuthorizePaymentResult = await adapter.authorizePayment(makeAuthorizeRequest());

    expect(result.status).toBe("AUTHORIZED");
    expect(result.authorizationCode).toBeDefined();
    expect(result.paymentAttemptId).toBe("pay_501");
  });

  it("failure scenario: returns DECLINED for a token reference containing 'fail'", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.authorizePayment(
      makeAuthorizeRequest({ tokenReference: "tok_fail_card_99" })
    );

    expect(result.status).toBe("DECLINED");
    expect(result.declineReason).toBeDefined();
  });

  it("PCI-DSS: no raw PAN or CVV in authorization response", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.authorizePayment(makeAuthorizeRequest());
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/\b\d{16}\b/);
    expect(serialized).not.toMatch(/"cvv"\s*:/i);
  });

  it("includes authorizedAt timestamp", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.authorizePayment(makeAuthorizeRequest());
    if (result.status === "AUTHORIZED") {
      expect(result.authorizedAt).toBeDefined();
      expect(new Date(result.authorizedAt!).getTime()).not.toBeNaN();
    }
  });
});

// ── capturePayment ────────────────────────────────────────────────────────────

describe("MockPSPAdapter.capturePayment", () => {
  it("happy path: returns CAPTURED for a valid authorizationCode", async () => {
    const req: CapturePaymentRequest = {
      authorizationCode: "auth_valid_001",
      paymentAttemptId: "pay_501",
      amount: 18999.0,
      currencyCode: "ZAR",
    };
    const adapter = new MockPSPAdapter();
    const result: CapturePaymentResult = await adapter.capturePayment(req);

    expect(result.status).toBe("CAPTURED");
    expect(result.capturedAt).toBeDefined();
  });

  it("failure scenario: returns CAPTURE_FAILED for authorization code containing 'fail'", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.capturePayment({
      authorizationCode: "auth_fail_002",
      paymentAttemptId: "pay_502",
      amount: 500.0,
      currencyCode: "ZAR",
    });

    expect(result.status).toBe("CAPTURE_FAILED");
  });
});

// ── refundPayment ─────────────────────────────────────────────────────────────

describe("MockPSPAdapter.refundPayment", () => {
  it("happy path: returns REFUNDED for a captured transaction", async () => {
    const req: RefundPaymentRequest = {
      captureReference: "cap_valid_001",
      paymentAttemptId: "pay_501",
      refundAmount: 18999.0,
      currencyCode: "ZAR",
    };
    const adapter = new MockPSPAdapter();
    const result: RefundPaymentResult = await adapter.refundPayment(req);

    expect(result.status).toBe("REFUNDED");
    expect(result.refundReference).toBeDefined();
    expect(result.refundedAt).toBeDefined();
  });

  it("failure scenario: returns REFUND_FAILED for capture reference containing 'fail'", async () => {
    const adapter = new MockPSPAdapter();
    const result = await adapter.refundPayment({
      captureReference: "cap_fail_002",
      paymentAttemptId: "pay_502",
      refundAmount: 500.0,
      currencyCode: "ZAR",
    });

    expect(result.status).toBe("REFUND_FAILED");
  });
});
