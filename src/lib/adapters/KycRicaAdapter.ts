/**
 * KycRicaAdapter — integration boundary for the KYC/RICA Verification Service.
 *
 * Business capability: identity verification and regulatory SIM registration
 * (RICA in South Africa) required before eSIM issuance or regulated SIM
 * activation can complete.
 *
 * Compliance domain: POPIA personal data handling, RICA telecommunications
 * registration, activation gating (LLD §8.1, VAL-08, VAL-09, NFR-32).
 *
 * All implementations must be substitutable without changing domain service
 * logic (IR-04).
 */

/** Customer fields submitted for identity verification. */
export interface VerificationCustomer {
  firstName: string;
  lastName: string;
  idDocumentType: string;
  idDocumentNumber: string;
  addressLine1: string;
  city: string;
}

/** Optional porting details attached to a verification case. */
export interface PortingDetails {
  requested: boolean;
  donorNetwork: string;
  msisdn: string;
  ownershipConfirmed: boolean;
}

/** Input submitted to the KYC/RICA service to open or update a case. */
export interface VerificationCaseInput {
  verificationCaseId: string;
  marketCode: string;
  productType: string;
  customer: VerificationCustomer;
  porting: PortingDetails | null;
}

/** Result returned by the KYC/RICA service for any verification operation. */
export interface VerificationResult {
  /** External reference assigned by the verification service. */
  verificationReference: string;
  /** Echo of the case identifier submitted by the caller. */
  verificationCaseId: string;
  /** COMPLETED | PENDING_REVIEW | FAILED */
  status: string;
  /** Document or data items still outstanding; empty on COMPLETED. */
  missingArtifacts: string[];
  /** Human-readable reason code present on FAILED outcomes. */
  reason?: string;
}

/**
 * KycRicaAdapter — contract for KYC/RICA verification service interactions.
 *
 * Used by OnboardingVerificationModule and ActivationModule to gate SIM/eSIM
 * activation on successful identity verification.
 */
export interface KycRicaAdapter {
  /**
   * Submit a new verification case or update an existing one with customer
   * identity and porting details.
   */
  submitVerificationCase(input: VerificationCaseInput): Promise<VerificationResult>;

  /**
   * Poll the current verification status for a previously submitted case.
   * Returns null when the case ID is not recognised by the service.
   */
  getVerificationStatus(verificationCaseId: string): Promise<VerificationResult | null>;

  /**
   * Request a re-evaluation of a previously submitted case, for example
   * after corrected documents have been provided.
   * Returns null when the case ID is not recognised by the service.
   */
  retryVerification(verificationCaseId: string): Promise<VerificationResult | null>;
}
