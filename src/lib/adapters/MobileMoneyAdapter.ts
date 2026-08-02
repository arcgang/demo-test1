/**
 * Mobile Money provider adapter (M-Pesa-like redirect/callback flow).
 *
 * Represents the boundary toward mobile money wallet providers such as M-Pesa.
 * Initiates a wallet debit, handles the async provider callback, and exposes
 * status queries. Orchestration services depend on this interface; swap the
 * mock for a real provider SDK without changing any service logic (IR-04).
 */

export interface InitiateWalletPaymentRequest {
  paymentAttemptId: string;
  walletProvider: string;
  walletReference: string;
  amount: number;
  currencyCode: string;
}

export interface InitiateWalletPaymentResult {
  paymentAttemptId: string;
  providerReference: string;
  status: "PENDING_PROVIDER_CONFIRMATION" | "INITIATION_FAILED";
  redirectInstruction?: string;
  ussdPrompt?: string;
  initiatedAt: string;
  failureReason?: string;
}

export interface PaymentCallbackPayload {
  providerReference: string;
  paymentAttemptId: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | string;
  walletReference: string;
  confirmedAt: string;
}

export interface WalletPaymentStatusResult {
  paymentAttemptId: string;
  status: "SUCCESS" | "PENDING" | "PENDING_PROVIDER_CONFIRMATION" | "FAILED" | "UNKNOWN";
  providerReference?: string;
  queriedAt: string;
}

/** Mobile Money wallet adapter interface. */
export interface MobileMoneyAdapter {
  /** Initiate a mobile money wallet debit and return the pending provider reference. */
  initiateWalletPayment(request: InitiateWalletPaymentRequest): Promise<InitiateWalletPaymentResult>;

  /** Process an inbound provider callback confirming or failing the wallet debit. */
  handlePaymentCallback(callback: PaymentCallbackPayload): Promise<void>;

  /** Query the current payment status by payment attempt id. */
  queryPaymentStatus(paymentAttemptId: string): Promise<WalletPaymentStatusResult>;
}

interface InternalState {
  status: WalletPaymentStatusResult["status"];
  providerReference?: string;
}

/** Deterministic mock for MobileMoneyAdapter — simulates M-Pesa-like redirect/callback flow. */
export class MockMobileMoneyAdapter implements MobileMoneyAdapter {
  private mmRefCounter = 0;
  private readonly state = new Map<string, InternalState>();

  async initiateWalletPayment(request: InitiateWalletPaymentRequest): Promise<InitiateWalletPaymentResult> {
    const initiatedAt = new Date().toISOString();
    if (request.walletReference.includes("fail")) {
      return {
        paymentAttemptId: request.paymentAttemptId,
        providerReference: "",
        status: "INITIATION_FAILED",
        initiatedAt,
        failureReason: "Wallet reference invalid or unreachable.",
      };
    }
    this.mmRefCounter += 1;
    const providerReference = `mpesa_pending_${this.mmRefCounter}_${request.paymentAttemptId}`;
    this.state.set(request.paymentAttemptId, {
      status: "PENDING_PROVIDER_CONFIRMATION",
      providerReference,
    });
    return {
      paymentAttemptId: request.paymentAttemptId,
      providerReference,
      status: "PENDING_PROVIDER_CONFIRMATION",
      ussdPrompt: `*150*00# to approve payment of ${request.currencyCode} ${request.amount}`,
      initiatedAt,
    };
  }

  async handlePaymentCallback(callback: PaymentCallbackPayload): Promise<void> {
    const existing = this.state.get(callback.paymentAttemptId);
    // Reject any callback that arrives after the record is already in a terminal state.
    if (existing && (existing.status === "SUCCESS" || existing.status === "FAILED")) {
      throw new Error(
        `Cannot process callback: payment ${callback.paymentAttemptId} is already in terminal state ${existing.status}`
      );
    }

    let mappedStatus: WalletPaymentStatusResult["status"];
    if (callback.status === "SUCCESS") mappedStatus = "SUCCESS";
    else if (callback.status === "FAILED") mappedStatus = "FAILED";
    else mappedStatus = "PENDING";

    this.state.set(callback.paymentAttemptId, {
      status: mappedStatus,
      providerReference: callback.providerReference,
    });
  }

  async queryPaymentStatus(paymentAttemptId: string): Promise<WalletPaymentStatusResult> {
    const queriedAt = new Date().toISOString();
    const entry = this.state.get(paymentAttemptId);
    if (!entry) {
      return { paymentAttemptId, status: "UNKNOWN", queriedAt };
    }
    return {
      paymentAttemptId,
      status: entry.status,
      providerReference: entry.providerReference,
      queriedAt,
    };
  }
}
