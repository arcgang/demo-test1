/**
 * Acceptance tests for MobileMoneyAdapter (M-Pesa-like wallet redirect/callback adapter).
 *
 * Verifies the interface contract and the MockMobileMoneyAdapter deterministic
 * behaviour across:
 *  - happy-path wallet payment initiation, callback handling, and status query
 *  - pending / awaiting-confirmation state (redirect flow)
 *  - payment failure scenario
 *  - idempotent callback handling
 */

import {
  type MobileMoneyAdapter,
  type InitiateWalletPaymentRequest,
  type InitiateWalletPaymentResult,
  type PaymentCallbackPayload,
  type WalletPaymentStatusResult,
  MockMobileMoneyAdapter,
} from "@/lib/adapters/MobileMoneyAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeWalletRequest(
  overrides: Partial<InitiateWalletPaymentRequest> = {}
): InitiateWalletPaymentRequest {
  return {
    paymentAttemptId: "pay_mm_501",
    walletProvider: "MPESA",
    walletReference: "27835550000",
    amount: 799.0,
    currencyCode: "ZAR",
    ...overrides,
  };
}

function makeCallback(overrides: Partial<PaymentCallbackPayload> = {}): PaymentCallbackPayload {
  return {
    providerReference: "mpesa_tx_12345",
    paymentAttemptId: "pay_mm_501",
    status: "SUCCESS",
    walletReference: "27835550000",
    confirmedAt: "2026-07-28T10:05:00Z",
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockMobileMoneyAdapter – interface compliance", () => {
  it("exposes initiateWalletPayment, handlePaymentCallback, and queryPaymentStatus", () => {
    const adapter: MobileMoneyAdapter = new MockMobileMoneyAdapter();
    expect(typeof adapter.initiateWalletPayment).toBe("function");
    expect(typeof adapter.handlePaymentCallback).toBe("function");
    expect(typeof adapter.queryPaymentStatus).toBe("function");
  });
});

// ── initiateWalletPayment ─────────────────────────────────────────────────────

describe("MockMobileMoneyAdapter.initiateWalletPayment", () => {
  it("happy path: returns PENDING_PROVIDER_CONFIRMATION with a provider reference", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result: InitiateWalletPaymentResult = await adapter.initiateWalletPayment(
      makeWalletRequest()
    );

    expect(result.status).toBe("PENDING_PROVIDER_CONFIRMATION");
    expect(result.paymentAttemptId).toBe("pay_mm_501");
    expect(result.providerReference).toBeDefined();
    expect(result.providerReference.length).toBeGreaterThan(0);
  });

  it("includes redirectInstruction or ussdPrompt for the redirect flow", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result = await adapter.initiateWalletPayment(makeWalletRequest());
    const hasNext = result.redirectInstruction != null || result.ussdPrompt != null;
    expect(hasNext).toBe(true);
  });

  it("failure scenario: returns INITIATION_FAILED for walletReference containing 'fail'", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result = await adapter.initiateWalletPayment(
      makeWalletRequest({ walletReference: "27835550000_fail", paymentAttemptId: "pay_fail_mm" })
    );

    expect(result.status).toBe("INITIATION_FAILED");
    expect(result.failureReason).toBeDefined();
  });

  it("includes initiatedAt timestamp", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result = await adapter.initiateWalletPayment(makeWalletRequest());
    expect(result.initiatedAt).toBeDefined();
    expect(new Date(result.initiatedAt).getTime()).not.toBeNaN();
  });
});

// ── handlePaymentCallback ─────────────────────────────────────────────────────

describe("MockMobileMoneyAdapter.handlePaymentCallback", () => {
  it("happy path: processes a SUCCESS callback without throwing", async () => {
    const adapter = new MockMobileMoneyAdapter();
    await expect(
      adapter.handlePaymentCallback(makeCallback({ status: "SUCCESS" }))
    ).resolves.toBeUndefined();
  });

  it("pending scenario: processes a PENDING callback and records it", async () => {
    const adapter = new MockMobileMoneyAdapter();
    await adapter.handlePaymentCallback(makeCallback({ status: "PENDING", paymentAttemptId: "pay_pend_01" }));

    const status = await adapter.queryPaymentStatus("pay_pend_01");
    expect(status.status).toBe("PENDING");
  });

  it("failure scenario: processes a FAILED callback and records it", async () => {
    const adapter = new MockMobileMoneyAdapter();
    await adapter.handlePaymentCallback(makeCallback({ status: "FAILED", paymentAttemptId: "pay_fail_02" }));

    const status = await adapter.queryPaymentStatus("pay_fail_02");
    expect(status.status).toBe("FAILED");
  });

  it("idempotent: processing the same SUCCESS callback twice does not duplicate state", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const cb = makeCallback({ paymentAttemptId: "pay_idem_03" });
    await adapter.handlePaymentCallback(cb);
    await adapter.handlePaymentCallback(cb);

    const status = await adapter.queryPaymentStatus("pay_idem_03");
    expect(status.status).toBe("SUCCESS");
  });

  it("verifies providerReference in the callback before accepting", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const cb = makeCallback({ providerReference: "mpesa_verified_ref", paymentAttemptId: "pay_verify_04" });
    await adapter.handlePaymentCallback(cb);

    const status = await adapter.queryPaymentStatus("pay_verify_04");
    expect(status.providerReference).toBe("mpesa_verified_ref");
  });
});

// ── queryPaymentStatus ────────────────────────────────────────────────────────

describe("MockMobileMoneyAdapter.queryPaymentStatus", () => {
  it("happy path: returns SUCCESS for an attempt that received a success callback", async () => {
    const adapter = new MockMobileMoneyAdapter();
    await adapter.handlePaymentCallback(makeCallback({ paymentAttemptId: "pay_q_success_01" }));

    const result: WalletPaymentStatusResult = await adapter.queryPaymentStatus("pay_q_success_01");
    expect(result.status).toBe("SUCCESS");
    expect(result.paymentAttemptId).toBe("pay_q_success_01");
  });

  it("returns UNKNOWN for an attempt id with no prior callback or initiation", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result = await adapter.queryPaymentStatus("pay_unknown_999");
    expect(result.status).toBe("UNKNOWN");
  });

  it("pending scenario: returns PENDING for an attempt still awaiting provider confirmation", async () => {
    const adapter = new MockMobileMoneyAdapter();
    await adapter.initiateWalletPayment(makeWalletRequest({ paymentAttemptId: "pay_q_pend_02" }));

    const result = await adapter.queryPaymentStatus("pay_q_pend_02");
    expect(result.status).toBe("PENDING_PROVIDER_CONFIRMATION");
  });

  it("includes queriedAt timestamp in response", async () => {
    const adapter = new MockMobileMoneyAdapter();
    const result = await adapter.queryPaymentStatus("pay_any_03");
    expect(result.queriedAt).toBeDefined();
    expect(new Date(result.queriedAt).getTime()).not.toBeNaN();
  });
});
