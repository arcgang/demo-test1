/**
 * Acceptance tests for TMF669EventStatusAdapter.
 *
 * Verifies the interface contract and the MockTMF669EventStatusAdapter
 * deterministic behaviour across:
 *  - happy-path event publishing and milestone polling
 *  - callback ingestion (success, pending, failure)
 *  - accumulated milestone history
 */

import {
  type EventStatusAdapter,
  type StatusEvent,
  type StatusMilestone,
  type CallbackPayload,
  MockTMF669EventStatusAdapter,
} from "@/lib/adapters/TMF669EventStatusAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStatusEvent(overrides: Partial<StatusEvent> = {}): StatusEvent {
  return {
    correlationId: "corr_12af",
    entityType: "ORDER",
    entityId: "ord_3001",
    eventType: "ORDER_CONFIRMED",
    payload: { orderStatus: "PAYMENT_CONFIRMED" },
    ...overrides,
  };
}

function makeCallback(overrides: Partial<CallbackPayload> = {}): CallbackPayload {
  return {
    correlationId: "corr_12af",
    providerReference: "mpesa_tx_12345",
    entityId: "pay_501",
    status: "SUCCESS",
    occurredAt: "2026-07-28T10:05:00Z",
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockTMF669EventStatusAdapter – interface compliance", () => {
  it("exposes publishStatusEvent, pollStatusMilestones, and ingestCallback", () => {
    const adapter: EventStatusAdapter = new MockTMF669EventStatusAdapter();
    expect(typeof adapter.publishStatusEvent).toBe("function");
    expect(typeof adapter.pollStatusMilestones).toBe("function");
    expect(typeof adapter.ingestCallback).toBe("function");
  });
});

// ── publishStatusEvent ────────────────────────────────────────────────────────

describe("MockTMF669EventStatusAdapter.publishStatusEvent", () => {
  it("happy path: resolves without error for a valid event", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await expect(adapter.publishStatusEvent(makeStatusEvent())).resolves.toBeUndefined();
  });

  it("published event is retrievable via pollStatusMilestones", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.publishStatusEvent(makeStatusEvent());

    const milestones: StatusMilestone[] = await adapter.pollStatusMilestones("ord_3001");
    expect(milestones.length).toBeGreaterThanOrEqual(1);
    expect(milestones.some((m) => m.entityId === "ord_3001")).toBe(true);
  });

  it("accumulates multiple published events for the same entity", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.publishStatusEvent(makeStatusEvent({ eventType: "PAYMENT_CONFIRMED" }));
    await adapter.publishStatusEvent(makeStatusEvent({ eventType: "ORDER_CONFIRMED" }));

    const milestones = await adapter.pollStatusMilestones("ord_3001");
    expect(milestones.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty milestones for an entity with no published events", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    const milestones = await adapter.pollStatusMilestones("ord_unknown_999");
    expect(milestones).toEqual([]);
  });
});

// ── pollStatusMilestones ──────────────────────────────────────────────────────

describe("MockTMF669EventStatusAdapter.pollStatusMilestones", () => {
  it("each milestone includes milestoneType, status, and timestamp", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.publishStatusEvent(makeStatusEvent());

    const milestones = await adapter.pollStatusMilestones("ord_3001");
    for (const m of milestones) {
      expect(m.milestoneType).toBeDefined();
      expect(m.status).toBeDefined();
      expect(m.timestamp).toBeDefined();
      expect(new Date(m.timestamp).getTime()).not.toBeNaN();
    }
  });

  it("milestones for different entities are isolated", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.publishStatusEvent(makeStatusEvent({ entityId: "ord_A" }));
    await adapter.publishStatusEvent(makeStatusEvent({ entityId: "ord_B" }));

    const milestonesA = await adapter.pollStatusMilestones("ord_A");
    const milestonesB = await adapter.pollStatusMilestones("ord_B");

    expect(milestonesA.every((m) => m.entityId === "ord_A")).toBe(true);
    expect(milestonesB.every((m) => m.entityId === "ord_B")).toBe(true);
  });
});

// ── ingestCallback ────────────────────────────────────────────────────────────

describe("MockTMF669EventStatusAdapter.ingestCallback", () => {
  it("happy path: ingests a SUCCESS callback and appends a milestone", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.ingestCallback(makeCallback({ status: "SUCCESS", entityId: "pay_success_01" }));

    const milestones = await adapter.pollStatusMilestones("pay_success_01");
    expect(milestones.some((m) => m.status === "SUCCESS")).toBe(true);
  });

  it("pending scenario: ingests a PENDING callback without treating it as terminal", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.ingestCallback(makeCallback({ status: "PENDING", entityId: "pay_pending_02" }));

    const milestones = await adapter.pollStatusMilestones("pay_pending_02");
    expect(milestones.some((m) => m.status === "PENDING")).toBe(true);
  });

  it("failure scenario: ingests a FAILED callback and records it as terminal failure", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    await adapter.ingestCallback(makeCallback({ status: "FAILED", entityId: "pay_fail_03" }));

    const milestones = await adapter.pollStatusMilestones("pay_fail_03");
    expect(milestones.some((m) => m.status === "FAILED")).toBe(true);
  });

  it("callback includes providerReference in the recorded milestone", async () => {
    const adapter = new MockTMF669EventStatusAdapter();
    const callback = makeCallback({ providerReference: "mpesa_tx_unique_xyz", entityId: "pay_ref_04" });
    await adapter.ingestCallback(callback);

    const milestones = await adapter.pollStatusMilestones("pay_ref_04");
    expect(milestones.some((m) => m.providerReference === "mpesa_tx_unique_xyz")).toBe(true);
  });
});
