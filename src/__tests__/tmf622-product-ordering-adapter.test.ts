/**
 * Acceptance tests for TMF622ProductOrderingAdapter.
 *
 * Verifies the interface contract and the MockTMF622ProductOrderingAdapter
 * deterministic behaviour across:
 *  - happy-path order submission and status polling
 *  - order in pending / in-progress state
 *  - order failure state
 *  - state update propagation
 */

import {
  type OrderingAdapter,
  type OrderRequest,
  type OrderSubmissionResult,
  type OrderStatusResult,
  MockTMF622ProductOrderingAdapter,
} from "@/lib/adapters/TMF622ProductOrderingAdapter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeOrderRequest(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    cartId: "cart_8f3a",
    customerId: "cust_1001",
    marketCode: "ZA",
    currencyCode: "ZAR",
    totalAmount: 18999.0,
    items: [
      { lineType: "DEVICE", productId: "prod_device_iphone15", displayName: "iPhone 15", quantity: 1 },
    ],
    ...overrides,
  };
}

// ── Interface compliance ──────────────────────────────────────────────────────

describe("MockTMF622ProductOrderingAdapter – interface compliance", () => {
  it("exposes submitOrder, getOrderStatus, and updateOrderState", () => {
    const adapter: OrderingAdapter = new MockTMF622ProductOrderingAdapter();
    expect(typeof adapter.submitOrder).toBe("function");
    expect(typeof adapter.getOrderStatus).toBe("function");
    expect(typeof adapter.updateOrderState).toBe("function");
  });
});

// ── submitOrder ───────────────────────────────────────────────────────────────

describe("MockTMF622ProductOrderingAdapter.submitOrder", () => {
  it("happy path: resolves with externalOrderReference and RECEIVED status", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result: OrderSubmissionResult = await adapter.submitOrder(makeOrderRequest());

    expect(result.externalOrderReference).toBeDefined();
    expect(typeof result.externalOrderReference).toBe("string");
    expect(result.externalOrderReference.length).toBeGreaterThan(0);
    expect(result.status).toBe("RECEIVED");
  });

  it("returns a unique externalOrderReference per submission", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const r1 = await adapter.submitOrder(makeOrderRequest());
    const r2 = await adapter.submitOrder(makeOrderRequest());
    expect(r1.externalOrderReference).not.toBe(r2.externalOrderReference);
  });

  it("fail scenario: rejects or returns FAILED when cartId contains 'fail'", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result = await adapter.submitOrder(makeOrderRequest({ cartId: "cart_fail_001" }));
    expect(result.status).toBe("FAILED");
  });

  it("includes submittedAt timestamp in the result", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result = await adapter.submitOrder(makeOrderRequest());
    expect(result.submittedAt).toBeDefined();
    expect(new Date(result.submittedAt).getTime()).not.toBeNaN();
  });
});

// ── getOrderStatus ────────────────────────────────────────────────────────────

describe("MockTMF622ProductOrderingAdapter.getOrderStatus", () => {
  it("returns IN_PROGRESS for a reference containing 'pending'", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result: OrderStatusResult = await adapter.getOrderStatus("ext_order_pending_123");

    expect(result.externalOrderReference).toBe("ext_order_pending_123");
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("returns COMPLETED for a reference not containing sentinel tokens", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result = await adapter.getOrderStatus("ext_order_completed_456");

    expect(result.status).toBe("COMPLETED");
  });

  it("returns FAILED for a reference containing 'fail'", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result = await adapter.getOrderStatus("ext_order_fail_789");

    expect(result.status).toBe("FAILED");
    expect(result.failureReason).toBeDefined();
  });

  it("happy path: status includes lastUpdatedAt", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    const result = await adapter.getOrderStatus("ext_order_abc");
    expect(result.lastUpdatedAt).toBeDefined();
    expect(new Date(result.lastUpdatedAt).getTime()).not.toBeNaN();
  });
});

// ── updateOrderState ──────────────────────────────────────────────────────────

describe("MockTMF622ProductOrderingAdapter.updateOrderState", () => {
  it("happy path: resolves without throwing for valid state transition", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    await expect(
      adapter.updateOrderState("ext_order_abc", "CANCELLED")
    ).resolves.toBeUndefined();
  });

  it("state is reflected in subsequent getOrderStatus after update", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    await adapter.updateOrderState("ext_order_tracked", "COMPLETED");
    const result = await adapter.getOrderStatus("ext_order_tracked");
    expect(result.status).toBe("COMPLETED");
  });

  it("fail scenario: rejects when reference contains 'fail'", async () => {
    const adapter = new MockTMF622ProductOrderingAdapter();
    await expect(
      adapter.updateOrderState("ext_order_fail_immutable", "COMPLETED")
    ).rejects.toBeDefined();
  });

  it.each(["COMPLETED", "FAILED", "CANCELLED"] as const)(
    "rejects a transition out of terminal state %s",
    async (terminalState) => {
      const adapter = new MockTMF622ProductOrderingAdapter();
      await adapter.updateOrderState("ext_order_abc", terminalState);
      await expect(
        adapter.updateOrderState("ext_order_abc", "IN_PROGRESS")
      ).rejects.toThrow(/terminal state/);
    }
  );
});
