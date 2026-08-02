/**
 * TMF622 Product Ordering Management adapter.
 *
 * Represents the boundary toward the TM Forum TMF622 Product Ordering API.
 * Orchestration services depend on this interface; swap the mock for a real
 * HTTP client without changing any service logic (IR-04).
 */

export interface OrderRequestItem {
  lineType: string;
  productId: string;
  displayName: string;
  quantity: number;
}

export interface OrderRequest {
  cartId: string;
  customerId: string;
  marketCode: string;
  currencyCode: string;
  totalAmount: number;
  items: OrderRequestItem[];
}

export interface OrderSubmissionResult {
  externalOrderReference: string;
  status: "RECEIVED" | "FAILED";
  submittedAt: string;
  failureReason?: string;
}

export interface OrderStatusResult {
  externalOrderReference: string;
  status: "RECEIVED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  lastUpdatedAt: string;
  failureReason?: string;
}

/** TMF622 Product Ordering adapter interface. */
export interface OrderingAdapter {
  /** Submit a new product order to the ordering system. */
  submitOrder(request: OrderRequest): Promise<OrderSubmissionResult>;

  /** Retrieve current order status by external reference. */
  getOrderStatus(externalOrderReference: string): Promise<OrderStatusResult>;

  /** Push a state update for an order (e.g. CANCELLED, COMPLETED). */
  updateOrderState(externalOrderReference: string, newState: OrderStatusResult["status"]): Promise<void>;
}

/** Deterministic mock for TMF622 ProductOrderingAdapter. */
export class MockTMF622ProductOrderingAdapter implements OrderingAdapter {
  private refCounter = 0;
  private readonly overrides = new Map<string, OrderStatusResult["status"]>();

  async submitOrder(request: OrderRequest): Promise<OrderSubmissionResult> {
    const submittedAt = new Date().toISOString();
    if (request.cartId.includes("fail")) {
      return { externalOrderReference: "", status: "FAILED", submittedAt, failureReason: "Order rejected by downstream system." };
    }
    this.refCounter += 1;
    const externalOrderReference = `ext_order_${this.refCounter}_${request.cartId}`;
    return { externalOrderReference, status: "RECEIVED", submittedAt };
  }

  async getOrderStatus(externalOrderReference: string): Promise<OrderStatusResult> {
    const lastUpdatedAt = new Date().toISOString();
    const override = this.overrides.get(externalOrderReference);
    if (override) {
      return { externalOrderReference, status: override, lastUpdatedAt };
    }
    if (externalOrderReference.includes("fail")) {
      return { externalOrderReference, status: "FAILED", lastUpdatedAt, failureReason: "Order processing failed." };
    }
    if (externalOrderReference.includes("pending")) {
      return { externalOrderReference, status: "IN_PROGRESS", lastUpdatedAt };
    }
    return { externalOrderReference, status: "COMPLETED", lastUpdatedAt };
  }

  async updateOrderState(externalOrderReference: string, newState: OrderStatusResult["status"]): Promise<void> {
    const TERMINAL: Array<OrderStatusResult["status"]> = ["COMPLETED", "FAILED", "CANCELLED"];
    const storedState = this.overrides.get(externalOrderReference);
    if (storedState !== undefined && TERMINAL.includes(storedState)) {
      throw new Error(`Cannot update order already in terminal state ${storedState}: ${externalOrderReference}`);
    }
    if (externalOrderReference.includes("fail")) {
      throw new Error(`Cannot update immutable failed order: ${externalOrderReference}`);
    }
    this.overrides.set(externalOrderReference, newState);
  }
}
