/**
 * Acceptance tests: KycRicaAdapter interface and MockKycRicaAdapter
 * — verifies submitVerificationCase, getVerificationStatus, retryVerification
 *   cover PENDING, COMPLETED, and FAILED outcomes required by activation gating
 *   (LLD §8.1, IR-04, NFR-32).
 *
 * Tests MUST FAIL until the following are implemented:
 *   1. Interface KycRicaAdapter exported from @/lib/adapters/KycRicaAdapter
 *   2. Class MockKycRicaAdapter exported from @/lib/adapters/mocks/MockKycRicaAdapter
 *      implementing KycRicaAdapter with all three outcome scenarios.
 */

import {
  type KycRicaAdapter,
  type VerificationCaseInput,
  type VerificationResult,
} from "@/lib/adapters/KycRicaAdapter";
import { MockKycRicaAdapter } from "@/lib/adapters/mocks/MockKycRicaAdapter";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_INPUT: VerificationCaseInput = {
  verificationCaseId: "ver_9001",
  marketCode: "ZA",
  productType: "ESIM",
  customer: {
    firstName: "Amina",
    lastName: "Dlamini",
    idDocumentType: "NATIONAL_ID",
    idDocumentNumber: "9001015800088",
    addressLine1: "10 Palm Street",
    city: "Johannesburg",
  },
  porting: null,
};

// ── Interface compliance ───────────────────────────────────────────────────────

describe("KycRicaAdapter – interface compliance", () => {
  it("MockKycRicaAdapter implements KycRicaAdapter", () => {
    const adapter: KycRicaAdapter = new MockKycRicaAdapter();
    expect(adapter).toBeDefined();
  });

  it("exposes submitVerificationCase as a function", () => {
    const adapter: KycRicaAdapter = new MockKycRicaAdapter();
    expect(typeof adapter.submitVerificationCase).toBe("function");
  });

  it("exposes getVerificationStatus as a function", () => {
    const adapter: KycRicaAdapter = new MockKycRicaAdapter();
    expect(typeof adapter.getVerificationStatus).toBe("function");
  });

  it("exposes retryVerification as a function", () => {
    const adapter: KycRicaAdapter = new MockKycRicaAdapter();
    expect(typeof adapter.retryVerification).toBe("function");
  });
});

// ── submitVerificationCase ────────────────────────────────────────────────────

describe("MockKycRicaAdapter.submitVerificationCase – happy path", () => {
  it("returns a VerificationResult with a verificationReference string", async () => {
    const adapter = new MockKycRicaAdapter();
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(typeof result.verificationReference).toBe("string");
    expect(result.verificationReference.length).toBeGreaterThan(0);
  });

  it("returns verificationCaseId matching the input", async () => {
    const adapter = new MockKycRicaAdapter();
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(result.verificationCaseId).toBe(BASE_INPUT.verificationCaseId);
  });

  it("happy-path result has status COMPLETED or PENDING_REVIEW", async () => {
    const adapter = new MockKycRicaAdapter();
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(["COMPLETED", "PENDING_REVIEW"]).toContain(result.status);
  });

  it("happy-path result has an empty or null missingArtifacts list when COMPLETED", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(result.status).toBe("COMPLETED");
    expect(Array.isArray(result.missingArtifacts)).toBe(true);
    expect(result.missingArtifacts.length).toBe(0);
  });
});

describe("MockKycRicaAdapter.submitVerificationCase – pending scenario", () => {
  it("pending scenario returns status PENDING_REVIEW", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pending" });
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(result.status).toBe("PENDING_REVIEW");
  });

  it("pending scenario returns non-empty missingArtifacts", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pending" });
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(Array.isArray(result.missingArtifacts)).toBe(true);
    expect(result.missingArtifacts.length).toBeGreaterThan(0);
  });
});

describe("MockKycRicaAdapter.submitVerificationCase – failure scenario", () => {
  it("failure scenario returns status FAILED", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "fail" });
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    expect(result.status).toBe("FAILED");
  });

  it("failure scenario includes a non-empty reason or missingArtifacts", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "fail" });
    const result = await adapter.submitVerificationCase(BASE_INPUT);
    const hasReason =
      (result.reason && result.reason.length > 0) ||
      (Array.isArray(result.missingArtifacts) && result.missingArtifacts.length > 0);
    expect(hasReason).toBe(true);
  });
});

// ── getVerificationStatus ─────────────────────────────────────────────────────

describe("MockKycRicaAdapter.getVerificationStatus", () => {
  it("returns a VerificationResult for a known case ID", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result = await adapter.getVerificationStatus("ver_9001");
    expect(result).not.toBeNull();
    expect(typeof result!.verificationCaseId).toBe("string");
    expect(typeof result!.status).toBe("string");
  });

  it("reflects the configured scenario status", async () => {
    const passAdapter = new MockKycRicaAdapter({ scenario: "pass" });
    const passResult = await passAdapter.getVerificationStatus("ver_9001");
    expect(passResult!.status).toBe("COMPLETED");

    const failAdapter = new MockKycRicaAdapter({ scenario: "fail" });
    const failResult = await failAdapter.getVerificationStatus("ver_9001");
    expect(failResult!.status).toBe("FAILED");

    const pendingAdapter = new MockKycRicaAdapter({ scenario: "pending" });
    const pendingResult = await pendingAdapter.getVerificationStatus("ver_9001");
    expect(pendingResult!.status).toBe("PENDING_REVIEW");
  });

  it("returns null or throws for an unknown case ID", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result = await adapter.getVerificationStatus("ver_UNKNOWN_9999");
    expect(result).toBeNull();
  });
});

// ── retryVerification ─────────────────────────────────────────────────────────

describe("MockKycRicaAdapter.retryVerification", () => {
  it("returns a VerificationResult after retry", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result = await adapter.retryVerification("ver_9001");
    expect(result).not.toBeNull();
    expect(typeof result!.verificationCaseId).toBe("string");
    expect(typeof result!.status).toBe("string");
  });

  it("retry on pass scenario yields COMPLETED", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result = await adapter.retryVerification("ver_9001");
    expect(result!.status).toBe("COMPLETED");
  });

  it("retry on fail scenario yields FAILED", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "fail" });
    const result = await adapter.retryVerification("ver_9001");
    expect(result!.status).toBe("FAILED");
  });

  it("retry on pending scenario yields PENDING_REVIEW", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pending" });
    const result = await adapter.retryVerification("ver_9001");
    expect(result!.status).toBe("PENDING_REVIEW");
  });
});

// ── VerificationResult shape ──────────────────────────────────────────────────

describe("VerificationResult shape (LLD §8.2 mock contract)", () => {
  it("contains verificationReference, verificationCaseId, status, missingArtifacts", async () => {
    const adapter = new MockKycRicaAdapter({ scenario: "pass" });
    const result: VerificationResult = await adapter.submitVerificationCase(BASE_INPUT);
    expect(result).toHaveProperty("verificationReference");
    expect(result).toHaveProperty("verificationCaseId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("missingArtifacts");
  });

  it("missingArtifacts is always an array", async () => {
    for (const scenario of ["pass", "fail", "pending"] as const) {
      const adapter = new MockKycRicaAdapter({ scenario });
      const result = await adapter.submitVerificationCase(BASE_INPUT);
      expect(Array.isArray(result.missingArtifacts)).toBe(true);
    }
  });
});
