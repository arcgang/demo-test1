/**
 * Activation Status Service adapter.
 *
 * Represents the boundary toward the Activation Status Service — responsible
 * for gating SIM/eSIM activation on payment and KYC/RICA verification
 * prerequisites, advancing the activation state machine, and issuing eSIM
 * profiles when all gates are satisfied.
 * Orchestration services depend on this interface; swap the mock for a real
 * activation system without changing any service logic (IR-04).
 */

export interface RequestActivationInput {
  orderId: string;
  productType: string;
  paymentStatus: string;
  verificationStatus: string;
  marketCode: string;
}

export interface RequestActivationResult {
  orderId: string;
  activationState: "ACTIVATION_INITIATED" | "PENDING_PREREQUISITES" | "ACTIVATION_FAILED";
  activationReference?: string;
  blockedReasons?: string[];
  failureReason?: string;
  requestedAt: string;
}

export interface ActivationMilestone {
  milestone: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  timestamp: string;
}

export interface ESIMProfileResult {
  orderId: string;
  status: "ESIM_ISSUED" | "BLOCKED" | "FAILED";
  esimReference?: string;
  qrPayload?: string;
  issuedAt?: string;
}

/** Activation Status Service adapter interface. */
export interface ActivationStatusAdapter {
  /** Request activation for an order, gated on payment and verification prerequisites. */
  requestActivation(input: RequestActivationInput): Promise<RequestActivationResult>;

  /** Retrieve the ordered milestone progression sequence for an order. */
  getActivationMilestones(orderId: string): Promise<ActivationMilestone[]>;

  /** Issue an eSIM profile for the order; blocked until activation prerequisites succeed. */
  issueESIMProfile(orderId: string): Promise<ESIMProfileResult>;
}

interface InternalActivationRecord {
  state: RequestActivationResult["activationState"];
  milestones: ActivationMilestone[];
  esimReference?: string;
}

/** Deterministic mock for ActivationStatusAdapter — async milestone simulation. */
export class MockActivationStatusAdapter implements ActivationStatusAdapter {
  private activationRefCounter = 0;
  private esimRefCounter = 0;
  private readonly records = new Map<string, InternalActivationRecord>();

  async requestActivation(input: RequestActivationInput): Promise<RequestActivationResult> {
    const requestedAt = new Date().toISOString();

    if (input.orderId.includes("fail")) {
      const milestones: ActivationMilestone[] = [
        { milestone: "ACTIVATION_REQUESTED", status: "FAILED", timestamp: requestedAt },
      ];
      this.records.set(input.orderId, { state: "ACTIVATION_FAILED", milestones });
      return {
        orderId: input.orderId,
        activationState: "ACTIVATION_FAILED",
        failureReason: "Activation rejected by downstream system.",
        requestedAt,
      };
    }

    const blockedReasons: string[] = [];
    if (input.paymentStatus !== "SUCCESS") blockedReasons.push("PAYMENT_NOT_CONFIRMED");
    if (input.verificationStatus !== "COMPLETED") blockedReasons.push("VERIFICATION_NOT_COMPLETED");

    if (blockedReasons.length > 0) {
      const milestones: ActivationMilestone[] = [
        { milestone: "ACTIVATION_REQUESTED", status: "PENDING", timestamp: requestedAt },
      ];
      this.records.set(input.orderId, { state: "PENDING_PREREQUISITES", milestones });
      return {
        orderId: input.orderId,
        activationState: "PENDING_PREREQUISITES",
        blockedReasons,
        requestedAt,
      };
    }

    this.activationRefCounter += 1;
    const activationReference = `act_ref_${this.activationRefCounter}_${input.orderId}`;
    const milestones: ActivationMilestone[] = [
      { milestone: "PAYMENT_CONFIRMED", status: "SUCCESS", timestamp: requestedAt },
      { milestone: "VERIFICATION_COMPLETED", status: "SUCCESS", timestamp: requestedAt },
      { milestone: "ACTIVATION_INITIATED", status: "SUCCESS", timestamp: requestedAt },
    ];
    this.records.set(input.orderId, { state: "ACTIVATION_INITIATED", milestones });
    return {
      orderId: input.orderId,
      activationState: "ACTIVATION_INITIATED",
      activationReference,
      requestedAt,
    };
  }

  async getActivationMilestones(orderId: string): Promise<ActivationMilestone[]> {
    const record = this.records.get(orderId);
    if (!record) return [];
    return [...record.milestones];
  }

  async issueESIMProfile(orderId: string): Promise<ESIMProfileResult> {
    const issuedAt = new Date().toISOString();
    const record = this.records.get(orderId);

    if (!record || record.state === "PENDING_PREREQUISITES") {
      return { orderId, status: "BLOCKED" };
    }

    if (record.state === "ACTIVATION_FAILED") {
      return { orderId, status: "FAILED" };
    }

    // Idempotent: reuse existing esimReference if already issued.
    if (record.esimReference) {
      return {
        orderId,
        status: "ESIM_ISSUED",
        esimReference: record.esimReference,
        qrPayload: `LPA:1$smdp.mock.example.com$${record.esimReference}`,
        issuedAt,
      };
    }

    this.esimRefCounter += 1;
    const esimReference = `esim_ref_${this.esimRefCounter}_${orderId}`;
    record.esimReference = esimReference;
    record.milestones.push({ milestone: "ESIM_ISSUED", status: "SUCCESS", timestamp: issuedAt });

    return {
      orderId,
      status: "ESIM_ISSUED",
      esimReference,
      qrPayload: `LPA:1$smdp.mock.example.com$${esimReference}`,
      issuedAt,
    };
  }
}
