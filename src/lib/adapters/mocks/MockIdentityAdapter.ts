/**
 * Mock implementation of IdentityAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey B — valid authenticated customer (cust_1001)
 *   Failure   — invalid credentials → INVALID_CREDENTIAL
 *   Pending   — account requires step-up verification → STEP_UP_REQUIRED
 *   Lookup    — MSISDN identity resolution (ZA market)
 */

import type {
  IdentityAdapter,
  AuthenticationRequest,
  AuthenticationResult,
  IdentityLookupRequest,
  IdentityLookupResult,
} from "@/lib/adapters/adapter-interfaces/IdentityAdapter";

/** Valid credential tokens keyed by customerId. */
const VALID_CREDENTIALS: Record<string, string> = {
  cust_1001: "valid_token_cust_1001",
};

/** Customers that trigger step-up rather than outright rejection. */
const STEP_UP_CUSTOMERS = new Set(["cust_locked_pending"]);

const STEP_UP_CREDENTIALS: Record<string, string> = {
  cust_locked_pending: "valid_token_cust_locked",
};

/** MSISDN → customerId index for identity lookups. */
const MSISDN_IDENTITY: Record<string, { customerId: string; marketCode: string }> = {
  "27831234567": { customerId: "cust_1001", marketCode: "ZA" },
  "27835550000": { customerId: "cust_2001", marketCode: "ZA" },
};

export class MockIdentityAdapter implements IdentityAdapter {
  async authenticateCustomer(request: AuthenticationRequest): Promise<AuthenticationResult> {
    if (STEP_UP_CUSTOMERS.has(request.customerId)) {
      if (STEP_UP_CREDENTIALS[request.customerId] === request.credential) {
        return { authenticated: false, error: "STEP_UP_REQUIRED" };
      }
      return { authenticated: false, error: "INVALID_CREDENTIAL" };
    }

    const expectedToken = VALID_CREDENTIALS[request.customerId];
    if (expectedToken && expectedToken === request.credential) {
      return {
        authenticated: true,
        customerId: request.customerId,
        sessionToken: `session_${request.customerId}_mock`,
      };
    }

    return { authenticated: false, error: "INVALID_CREDENTIAL" };
  }

  async lookupIdentity(request: IdentityLookupRequest): Promise<IdentityLookupResult> {
    if (!request.msisdn) return { found: false };
    const entry = MSISDN_IDENTITY[request.msisdn];
    if (!entry) return { found: false };
    return { found: true, customerId: entry.customerId, marketCode: entry.marketCode };
  }
}
