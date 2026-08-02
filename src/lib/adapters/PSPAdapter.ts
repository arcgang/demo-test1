/**
 * PSP (Payment Service Provider) tokenized card adapter.
 *
 * Represents the boundary toward the PSP Tokenization Service. Accepts only
 * tokenized card references — raw PAN, CVV, and expiry values are NEVER
 * accepted or returned through this boundary (PCI-DSS alignment).
 * Orchestration services depend on this interface; swap the mock for a real
 * sandbox or production PSP SDK without changing any service logic (IR-04).
 */

export interface TokenizeCardRequest {
  /** PSP-issued session token from the client-side tokenization widget. */
  pspSessionToken: string;
  lastFour: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

export interface TokenizeCardResult {
  /** Opaque token reference — never a raw PAN. */
  tokenReference: string;
  lastFour: string;
  tokenizedAt: string;
}

export interface AuthorizePaymentRequest {
  tokenReference: string;
  amount: number;
  currencyCode: string;
  paymentAttemptId: string;
}

export interface AuthorizePaymentResult {
  paymentAttemptId: string;
  status: "AUTHORIZED" | "DECLINED";
  authorizationCode?: string;
  authorizedAt?: string;
  declineReason?: string;
}

export interface CapturePaymentRequest {
  authorizationCode: string;
  paymentAttemptId: string;
  amount: number;
  currencyCode: string;
}

export interface CapturePaymentResult {
  paymentAttemptId: string;
  status: "CAPTURED" | "CAPTURE_FAILED";
  captureReference?: string;
  capturedAt?: string;
}

export interface RefundPaymentRequest {
  captureReference: string;
  paymentAttemptId: string;
  refundAmount: number;
  currencyCode: string;
}

export interface RefundPaymentResult {
  paymentAttemptId: string;
  status: "REFUNDED" | "REFUND_FAILED";
  refundReference?: string;
  refundedAt?: string;
}

/** PSP tokenized card adapter interface. */
export interface PSPAdapter {
  /** Exchange a PSP session token for a reusable card token reference. */
  tokenizeCard(request: TokenizeCardRequest): Promise<TokenizeCardResult>;

  /** Authorize a charge against a card token reference. */
  authorizePayment(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResult>;

  /** Capture a previously authorized charge. */
  capturePayment(request: CapturePaymentRequest): Promise<CapturePaymentResult>;

  /** Refund a previously captured charge. */
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResult>;
}

/** Deterministic mock for PSPAdapter — sandbox/simulated tokenized card responses. */
export class MockPSPAdapter implements PSPAdapter {
  private tokenCounter = 0;

  async tokenizeCard(request: TokenizeCardRequest): Promise<TokenizeCardResult> {
    if (request.pspSessionToken.includes("fail")) {
      throw new Error("PSP session token invalid or expired.");
    }
    this.tokenCounter += 1;
    return {
      tokenReference: `tok_mock_${this.tokenCounter}_${request.lastFour}`,
      lastFour: request.lastFour,
      tokenizedAt: new Date().toISOString(),
    };
  }

  async authorizePayment(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResult> {
    if (request.tokenReference.includes("fail")) {
      return {
        paymentAttemptId: request.paymentAttemptId,
        status: "DECLINED",
        declineReason: "Insufficient funds.",
      };
    }
    return {
      paymentAttemptId: request.paymentAttemptId,
      status: "AUTHORIZED",
      authorizationCode: `auth_${request.paymentAttemptId}`,
      authorizedAt: new Date().toISOString(),
    };
  }

  async capturePayment(request: CapturePaymentRequest): Promise<CapturePaymentResult> {
    if (request.authorizationCode.includes("fail")) {
      return { paymentAttemptId: request.paymentAttemptId, status: "CAPTURE_FAILED" };
    }
    return {
      paymentAttemptId: request.paymentAttemptId,
      status: "CAPTURED",
      captureReference: `cap_${request.authorizationCode}`,
      capturedAt: new Date().toISOString(),
    };
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResult> {
    if (request.captureReference.includes("fail")) {
      return { paymentAttemptId: request.paymentAttemptId, status: "REFUND_FAILED" };
    }
    return {
      paymentAttemptId: request.paymentAttemptId,
      status: "REFUNDED",
      refundReference: `ref_${request.captureReference}`,
      refundedAt: new Date().toISOString(),
    };
  }
}
