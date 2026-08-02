import type {
  KycRicaAdapter,
  VerificationCaseInput,
  VerificationResult,
} from "@/lib/adapters/KycRicaAdapter";

type Scenario = "pass" | "fail" | "pending";

interface MockKycRicaAdapterOptions {
  scenario?: Scenario;
}

const KNOWN_CASE_ID = "ver_9001";

const RESULTS: Record<Scenario, Omit<VerificationResult, "verificationCaseId">> = {
  pass: {
    verificationReference: "rica_8901",
    status: "COMPLETED",
    missingArtifacts: [],
  },
  pending: {
    verificationReference: "rica_8902",
    status: "PENDING_REVIEW",
    missingArtifacts: ["UPLOAD_PROOF_OF_ADDRESS"],
  },
  fail: {
    verificationReference: "rica_8903",
    status: "FAILED",
    missingArtifacts: ["VALID_ID_DOCUMENT"],
    reason: "ID document could not be verified.",
  },
};

/**
 * MockKycRicaAdapter — deterministic KYC/RICA adapter for demo and testing.
 *
 * Covers pass, pending, and fail scenarios required by activation gating
 * (LLD §8.1, IR-04).
 */
export class MockKycRicaAdapter implements KycRicaAdapter {
  private readonly scenario: Scenario;

  constructor(options: MockKycRicaAdapterOptions = {}) {
    this.scenario = options.scenario ?? "pass";
  }

  async submitVerificationCase(input: VerificationCaseInput): Promise<VerificationResult> {
    return {
      verificationCaseId: input.verificationCaseId,
      ...RESULTS[this.scenario],
    };
  }

  async getVerificationStatus(verificationCaseId: string): Promise<VerificationResult | null> {
    if (verificationCaseId !== KNOWN_CASE_ID) return null;
    return {
      verificationCaseId,
      ...RESULTS[this.scenario],
    };
  }

  async retryVerification(verificationCaseId: string): Promise<VerificationResult | null> {
    if (verificationCaseId !== KNOWN_CASE_ID) return null;
    return {
      verificationCaseId,
      ...RESULTS[this.scenario],
    };
  }
}
