/**
 * Mock implementation of TMF632 PartyManagementAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey B — authenticated contract upgrade customer (cust_1001)
 *   Journey D — new SIM onboarding customer (cust_2001)
 *   Pending   — customer profile under review (cust_pending_review)
 */

import type {
  PartyManagementAdapter,
  CustomerProfile,
  PartyLookupInput,
  PartyLookupResult,
} from "@/lib/adapters/adapter-interfaces/PartyManagementAdapter";

const CUSTOMER_PROFILES: Record<string, CustomerProfile> = {
  cust_1001: {
    customerId: "cust_1001",
    firstName: "Lerato",
    lastName: "Mokoena",
    email: "lerato.mokoena@example.co.za",
    accountId: "acc_1001",
    status: "ACTIVE",
  },
  cust_2001: {
    customerId: "cust_2001",
    firstName: "Amina",
    lastName: "Dlamini",
    email: "amina.dlamini@example.co.za",
    status: "ACTIVE",
  },
  cust_pending_review: {
    customerId: "cust_pending_review",
    firstName: "Sipho",
    lastName: "Nkosi",
    email: "sipho.nkosi@example.co.za",
    status: "PENDING",
  },
};

/** MSISDN → customerId reverse lookup table */
const MSISDN_INDEX: Record<string, string> = {
  "27831234567": "cust_1001",
  "27835550000": "cust_2001",
};

export class MockPartyManagementAdapter implements PartyManagementAdapter {
  async getCustomer(customerId: string): Promise<CustomerProfile | null> {
    if (!customerId) return null;
    return CUSTOMER_PROFILES[customerId] ?? null;
  }

  async lookupParty(input: PartyLookupInput): Promise<PartyLookupResult> {
    if (input.customerId) {
      const profile = CUSTOMER_PROFILES[input.customerId];
      if (profile) return { found: true, customerId: profile.customerId };
    }
    if (input.msisdn) {
      const customerId = MSISDN_INDEX[input.msisdn];
      if (customerId) return { found: true, customerId };
    }
    return { found: false };
  }
}
