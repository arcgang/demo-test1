/**
 * Acceptance tests for ActivationStatusAdapter.
 *
 * Verifies the interface contract and the MockActivationStatusAdapter
 * deterministic behaviour across:
 *  - happy-path activation request and eSIM issuance
 *  - activation pending / in-progress milestone progression
 *  - activation failure scenario
 *  - eSIM blocked when prerequisites not met
 *  - milestone sequence ordering
 */

import {
  type ActivationStatusAdapter,
  type RequestActivationInput,
  type RequestActivationResult,
  type ActivationMilestone,
  type ESIMProfileResult,
  MockActivationStatusAdapter,
} from "@/lib/adapters/ActivationStatusAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeActivationRequest(
  overrides: Partial<RequestActivationInput> = {}
): RequestActivationInput {
  return {
    orderId: "ord_3001",
    productType: "ESIM",
    paymentStatus: "SUCCESS",
    verificationStatus: "COMPLETED",
    marketCode: "ZA",
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockActivationStatusAdapter – interface compliance", () => {
  it("exposes requestActivation, getActivationMilestones, and issueESIMProfile", () => {
    const adapter: ActivationStatusAdapter = new MockActivationStatusAdapter();
    expect(typeof adapter.requestActivation).toBe("function");
    expect(typeof adapter.getActivationMilestones).toBe("function");
    expect(typeof adapter.issueESIMProfile).toBe("function");
  });
});

// ── requestActivation ─────────────────────────────────────────────────────────

describe("MockActivationStatusAdapter.requestActivation", () => {
  it("happy path: returns ACTIVATION_INITIATED when both payment and verification are SUCCESS/COMPLETED", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result: RequestActivationResult = await adapter.requestActivation(makeActivationRequest());

    expect(result.orderId).toBe("ord_3001");
    expect(result.activationState).toBe("ACTIVATION_INITIATED");
    expect(result.activationReference).toBeDefined();
  });

  it("activation-pending scenario: returns PENDING_PREREQUISITES when payment is not SUCCESS", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result = await adapter.requestActivation(
      makeActivationRequest({ paymentStatus: "PENDING", orderId: "ord_3002" })
    );

    expect(result.activationState).toBe("PENDING_PREREQUISITES");
    expect(result.blockedReasons).toContain("PAYMENT_NOT_CONFIRMED");
  });

  it("activation-pending scenario: returns PENDING_PREREQUISITES when verification is not COMPLETED", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result = await adapter.requestActivation(
      makeActivationRequest({ verificationStatus: "PENDING_REVIEW", orderId: "ord_3003" })
    );

    expect(result.activationState).toBe("PENDING_PREREQUISITES");
    expect(result.blockedReasons).toContain("VERIFICATION_NOT_COMPLETED");
  });

  it("activation-failure scenario: returns ACTIVATION_FAILED for orderId containing 'fail'", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result = await adapter.requestActivation(
      makeActivationRequest({ orderId: "ord_fail_9999" })
    );

    expect(result.activationState).toBe("ACTIVATION_FAILED");
    expect(result.failureReason).toBeDefined();
  });

  it("includes requestedAt timestamp", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result = await adapter.requestActivation(makeActivationRequest());
    expect(result.requestedAt).toBeDefined();
    expect(new Date(result.requestedAt).getTime()).not.toBeNaN();
  });
});

// ── getActivationMilestones ───────────────────────────────────────────────────

describe("MockActivationStatusAdapter.getActivationMilestones", () => {
  it("happy path: returns an ordered progression sequence for a fully activated order", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_milestone_001" }));

    const milestones: ActivationMilestone[] = await adapter.getActivationMilestones("ord_milestone_001");

    expect(milestones.length).toBeGreaterThanOrEqual(1);
    expect(milestones.some((m) => m.milestone === "PAYMENT_CONFIRMED")).toBe(true);
    expect(milestones.some((m) => m.milestone === "VERIFICATION_COMPLETED")).toBe(true);
  });

  it("each milestone includes milestone, status, and timestamp", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_milestone_002" }));

    const milestones = await adapter.getActivationMilestones("ord_milestone_002");
    for (const m of milestones) {
      expect(m.milestone).toBeDefined();
      expect(m.status).toBeDefined();
      expect(m.timestamp).toBeDefined();
      expect(new Date(m.timestamp).getTime()).not.toBeNaN();
    }
  });

  it("milestones are returned in chronological order", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_milestone_003" }));

    const milestones = await adapter.getActivationMilestones("ord_milestone_003");
    for (let i = 1; i < milestones.length; i++) {
      expect(new Date(milestones[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(milestones[i - 1].timestamp).getTime()
      );
    }
  });

  it("returns empty array for an unknown orderId", async () => {
    const adapter = new MockActivationStatusAdapter();
    const milestones = await adapter.getActivationMilestones("ord_nonexistent_999");
    expect(milestones).toEqual([]);
  });

  it("activation-failure scenario: includes a FAILED milestone entry", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_fail_ms_004" }));

    const milestones = await adapter.getActivationMilestones("ord_fail_ms_004");
    expect(milestones.some((m) => m.status === "FAILED")).toBe(true);
  });
});

// ── issueESIMProfile ──────────────────────────────────────────────────────────

describe("MockActivationStatusAdapter.issueESIMProfile", () => {
  it("happy path: returns ESIM_ISSUED with esimReference and qrPayload when prerequisites met", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_esim_001" }));

    const result: ESIMProfileResult = await adapter.issueESIMProfile("ord_esim_001");

    expect(result.status).toBe("ESIM_ISSUED");
    expect(result.esimReference).toBeDefined();
    expect(result.esimReference.length).toBeGreaterThan(0);
    expect(result.qrPayload).toBeDefined();
    expect(result.qrPayload!.length).toBeGreaterThan(0);
    expect(result.issuedAt).toBeDefined();
  });

  it("activation-pending scenario: returns BLOCKED when activation is still pending prerequisites", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(
      makeActivationRequest({ orderId: "ord_esim_pend_002", paymentStatus: "PENDING" })
    );

    const result = await adapter.issueESIMProfile("ord_esim_pend_002");
    expect(result.status).toBe("BLOCKED");
    expect(result.qrPayload).toBeUndefined();
  });

  it("activation-failure scenario: returns FAILED when activation failed", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_fail_esim_003" }));

    const result = await adapter.issueESIMProfile("ord_fail_esim_003");
    expect(result.status).toBe("FAILED");
    expect(result.qrPayload).toBeUndefined();
  });

  it("returns BLOCKED for an orderId that has no prior activation request", async () => {
    const adapter = new MockActivationStatusAdapter();
    const result = await adapter.issueESIMProfile("ord_never_activated_004");
    expect(result.status).toBe("BLOCKED");
  });

  it("eSIM issuance is idempotent: calling twice returns the same esimReference", async () => {
    const adapter = new MockActivationStatusAdapter();
    await adapter.requestActivation(makeActivationRequest({ orderId: "ord_esim_idem_005" }));

    const r1 = await adapter.issueESIMProfile("ord_esim_idem_005");
    const r2 = await adapter.issueESIMProfile("ord_esim_idem_005");
    expect(r1.esimReference).toBe(r2.esimReference);
  });
});
