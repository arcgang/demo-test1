/**
 * TMF676 Payment Management adapter.
 *
 * Represents the boundary toward the TM Forum TMF676 Payment Management API.
 * Orchestration services depend on this interface; swap the mock for a real
 * HTTP client without changing any service logic (IR-04).
 *
 * PCI-DSS: raw PAN, CVV, and expiry values are never accepted or returned.
 * Only provider token references flow through this boundary.
 */

export interface InitiatePaymentRequest {
  paymentAttemptId: string;
  paymentMethod: "CARD_TOKEN" | "MOBILE_MONEY" | string;
  amount: number;
  currencyCode: string;
  providerReference: string;
}

export interface InitiatePaymentResult {
  paymentAttemptId: string;
  status: "APPROVED" | "PENDING_PROVIDER_CONFIRMATION" | "DECLINED";
  providerTransactionId?: string;
  initiatedAt: string;
  failureReason?: string;
}

export interface PaymentStatusResult {
  paymentAttemptId: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  polledAt: string;
  failureReason?: string;
}

export interface ReconcilePaymentResult {
  paymentAttemptId: string;
  reconciledStatus: "SUCCESS" | "PENDING" | "FAILED";
  reconciledAt: string;
}

/** TMF676 Payment Management adapter interface. */
export interface PaymentManagementAdapter {
  /** Initiate a payment through the payment management boundary. */
  initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResult>;

  /** Poll current payment status by payment attempt id. */
  getPaymentStatus(paymentAttemptId: string): Promise<PaymentStatusResult>;

  /** Reconcile a payment outcome using the provider transaction reference. */
  reconcilePayment(paymentAttemptId: string, providerReference: string): Promise<ReconcilePaymentResult>;
}

/** Deterministic mock for TMF676 PaymentManagementAdapter. */
export class MockTMF676PaymentManagementAdapter implements PaymentManagementAdapter {
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResult> {
    const initiatedAt = new Date().toISOString();
    if (request.paymentAttemptId.includes("fail")) {
      return {
        paymentAttemptId: request.paymentAttemptId,
        status: "DECLINED",
        initiatedAt,
        failureReason: "Card declined by issuer.",
      };
    }
    if (request.paymentMethod === "MOBILE_MONEY") {
      return {
        paymentAttemptId: request.paymentAttemptId,
        status: "PENDING_PROVIDER_CONFIRMATION",
        providerTransactionId: `pmt_pending_${request.paymentAttemptId}`,
        initiatedAt,
      };
    }
    return {
      paymentAttemptId: request.paymentAttemptId,
      status: "APPROVED",
      providerTransactionId: `pmt_approved_${request.paymentAttemptId}`,
      initiatedAt,
    };
  }

  async getPaymentStatus(paymentAttemptId: string): Promise<PaymentStatusResult> {
    const polledAt = new Date().toISOString();
    if (paymentAttemptId.includes("fail")) {
      return { paymentAttemptId, status: "FAILED", polledAt, failureReason: "Payment processing failed." };
    }
    if (paymentAttemptId.includes("pending")) {
      return { paymentAttemptId, status: "PENDING", polledAt };
    }
    return { paymentAttemptId, status: "SUCCESS", polledAt };
  }

  async reconcilePayment(paymentAttemptId: string, providerReference: string): Promise<ReconcilePaymentResult> {
    const reconciledAt = new Date().toISOString();
    if (providerReference.includes("fail")) {
      return { paymentAttemptId, reconciledStatus: "FAILED", reconciledAt };
    }
    if (providerReference.includes("pending")) {
      return { paymentAttemptId, reconciledStatus: "PENDING", reconciledAt };
    }
    return { paymentAttemptId, reconciledStatus: "SUCCESS", reconciledAt };
  }
}
