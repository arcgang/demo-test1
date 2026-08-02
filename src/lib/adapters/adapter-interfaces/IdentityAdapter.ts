/**
 * Identity Service — adapter interface (NFR-32)
 *
 * Represents the Identity Service boundary as described in LLD §4.3 and §8.1.
 * Provides customer authentication and identity lookup for session bootstrap
 * and upgrade journey entry. Mock implementations must be replaceable without
 * touching domain service logic (IR-04).
 */

/** Credentials submitted for customer authentication. */
export interface AuthenticationRequest {
  customerId: string;
  /** Session token, OTP, or credential string — never a raw password in this demo. */
  credential: string;
  marketCode: string;
}

/** Result of an authentication attempt. */
export interface AuthenticationResult {
  authenticated: boolean;
  customerId?: string;
  /** Opaque session token issued on success. */
  sessionToken?: string;
  /** Error code on failure, e.g. INVALID_CREDENTIAL, STEP_UP_REQUIRED. */
  error?: string;
}

/** Input for an identity lookup by MSISDN. */
export interface IdentityLookupRequest {
  msisdn: string;
  marketCode: string;
}

/** Result of an identity lookup. */
export interface IdentityLookupResult {
  found: boolean;
  customerId?: string;
  marketCode?: string;
}

/**
 * IdentityAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface IdentityAdapter {
  /** Authenticate a customer using the supplied credential. */
  authenticateCustomer(request: AuthenticationRequest): Promise<AuthenticationResult>;

  /** Look up a customer identity by MSISDN within a market. */
  lookupIdentity(request: IdentityLookupRequest): Promise<IdentityLookupResult>;
}
