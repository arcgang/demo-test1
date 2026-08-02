/**
 * Acceptance tests for TMF676PaymentManagementAdapter.
 *
 * Verifies the interface contract and the MockTMF676PaymentManagementAdapter
 * deterministic behaviour across:
 *  - happy-path payment initiation and reconciliation
 *  - pending payment state
 *  - payment failure state
 *  - status query
 */

import {
  type PaymentManagementAdapter,
  type InitiatePaymentRequest,
  type InitiatePaymentResult,
  type PaymentStatusResult,
  type ReconcilePaymentResult,
  MockTMF676PaymentManagementAdapter,
} from "@/lib/adapters/TMF676PaymentManagementAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePaymentRequest(overrides: Partial<InitiatePaymentRequest> = {}): InitiatePaymentRequest {
  return {
    paymentAttemptId: "pay_501",
    paymentMethod: "CARD_TOKEN",
    amount: 18999.0,
    currencyCode: "ZAR",
    providerReference: "psp_token_abc123",
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockTMF676PaymentManagementAdapter – interface compliance", () => {
  it("exposes initiatePayment, getPaymentStatus, and reconcilePayment", () => {
    const adapter: PaymentManagementAdapter = new MockTMF676PaymentManagementAdapter();
    expect(typeof adapter.initiatePayment).toBe("function");
    expect(typeof adapter.getPaymentStatus).toBe("function");
    expect(typeof adapter.reconcilePayment).toBe("function");
  });
});

// ── initiatePayment ───────────────────────────────────────────────────────────

describe("MockTMF676PaymentManagementAdapter.initiatePayment", () => {
  it("happy path: resolves with APPROVED status for standard card token request", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result: InitiatePaymentResult = await adapter.initiatePayment(makePaymentRequest());

    expect(result.status).toBe("APPROVED");
    expect(result.paymentAttemptId).toBe("pay_501");
    expect(result.providerTransactionId).toBeDefined();
  });

  it("pending scenario: returns PENDING_PROVIDER_CONFIRMATION for mobile money method", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.initiatePayment(
      makePaymentRequest({ paymentMethod: "MOBILE_MONEY", paymentAttemptId: "pay_mm_001" })
    );

    expect(result.status).toBe("PENDING_PROVIDER_CONFIRMATION");
    expect(result.paymentAttemptId).toBe("pay_mm_001");
  });

  it("failure scenario: returns DECLINED when paymentAttemptId contains 'fail'", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.initiatePayment(
      makePaymentRequest({ paymentAttemptId: "pay_fail_999" })
    );

    expect(result.status).toBe("DECLINED");
    expect(result.failureReason).toBeDefined();
  });

  it("includes initiatedAt timestamp", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.initiatePayment(makePaymentRequest());
    expect(result.initiatedAt).toBeDefined();
    expect(new Date(result.initiatedAt).getTime()).not.toBeNaN();
  });

  it("never exposes raw PAN in result (PCI-DSS)", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.initiatePayment(makePaymentRequest());
    const serialized = JSON.stringify(result);
    // raw PAN pattern: 16-digit number string not a ref/id
    expect(serialized).not.toMatch(/\b\d{16}\b/);
  });
});

// ── getPaymentStatus ──────────────────────────────────────────────────────────

describe("MockTMF676PaymentManagementAdapter.getPaymentStatus", () => {
  it("happy path: returns SUCCESS for a confirmed payment attempt id", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result: PaymentStatusResult = await adapter.getPaymentStatus("pay_confirmed_001");

    expect(result.paymentAttemptId).toBe("pay_confirmed_001");
    expect(result.status).toBe("SUCCESS");
  });

  it("pending scenario: returns PENDING for attempt id containing 'pending'", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.getPaymentStatus("pay_pending_002");

    expect(result.status).toBe("PENDING");
  });

  it("failure scenario: returns FAILED for attempt id containing 'fail'", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.getPaymentStatus("pay_fail_003");

    expect(result.status).toBe("FAILED");
    expect(result.failureReason).toBeDefined();
  });

  it("includes polledAt timestamp", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.getPaymentStatus("pay_any_004");
    expect(result.polledAt).toBeDefined();
    expect(new Date(result.polledAt).getTime()).not.toBeNaN();
  });
});

// ── reconcilePayment ──────────────────────────────────────────────────────────

describe("MockTMF676PaymentManagementAdapter.reconcilePayment", () => {
  it("happy path: reconciles a confirmed provider reference as SUCCESS", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result: ReconcilePaymentResult = await adapter.reconcilePayment(
      "pay_501",
      "provider_confirmed_tx_abc"
    );

    expect(result.paymentAttemptId).toBe("pay_501");
    expect(result.reconciledStatus).toBe("SUCCESS");
    expect(result.reconciledAt).toBeDefined();
  });

  it("failure scenario: reconciles a failed provider reference as FAILED", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.reconcilePayment(
      "pay_601",
      "provider_fail_tx_xyz"
    );

    expect(result.reconciledStatus).toBe("FAILED");
  });

  it("pending scenario: reconciles a pending provider reference as PENDING", async () => {
    const adapter = new MockTMF676PaymentManagementAdapter();
    const result = await adapter.reconcilePayment(
      "pay_701",
      "provider_pending_tx_def"
    );

    expect(result.reconciledStatus).toBe("PENDING");
  });
});
