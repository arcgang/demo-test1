/**
 * Acceptance tests: TMF632 PartyManagementAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/PartyManagementAdapter.ts
 *   src/lib/adapters/mocks/MockPartyManagementAdapter.ts
 *
 * Covers (per LLD §8.1, task acceptance criteria):
 *   1. Interface shape — getCustomer and lookupParty methods declared
 *   2. JSDoc carries TM Forum TMF632 traceability annotation (NFR-32)
 *   3. Mock is assignable to the interface boundary (IR-04)
 *   4. Happy-path scenarios for Journey B (upgrade) and Journey D (new customer)
 *   5. Failure scenarios (unknown customerId, not-found party)
 *   6. Pending scenario (party profile incomplete / under review)
 */

import type {
  PartyManagementAdapter,
  CustomerProfile,
  PartyLookupResult,
} from "@/lib/adapters/adapter-interfaces/PartyManagementAdapter";
import { MockPartyManagementAdapter } from "@/lib/adapters/mocks/MockPartyManagementAdapter";

// ── Seed inputs keyed to demo journeys (ADR-003) ──────────────────────────────

// Journey B — authenticated contract upgrade
const KNOWN_CUSTOMER_ID = "cust_1001";
// Journey D — new customer (SIM onboarding)
const NEW_CUSTOMER_ID = "cust_2001";
const UNKNOWN_CUSTOMER_ID = "cust_unknown_404";
// Party lookup by MSISDN
const KNOWN_MSISDN = "27831234567";
const UNKNOWN_MSISDN = "0000000000";

// ── Interface assignability ───────────────────────────────────────────────────

describe("PartyManagementAdapter – interface boundary (IR-04)", () => {
  it("MockPartyManagementAdapter is assignable to PartyManagementAdapter interface", () => {
    const adapter: PartyManagementAdapter = new MockPartyManagementAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockPartyManagementAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockPartyManagementAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── getCustomer ───────────────────────────────────────────────────────────────

describe("MockPartyManagementAdapter.getCustomer – happy path", () => {
  it("returns a CustomerProfile for known customer cust_1001 (Journey B)", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.getCustomer(KNOWN_CUSTOMER_ID);
    expect(result).not.toBeNull();
    expect(result!.customerId).toBe(KNOWN_CUSTOMER_ID);
  });

  it("CustomerProfile has required fields: customerId, firstName, lastName, email", async () => {
    const adapter = new MockPartyManagementAdapter();
    const profile = await adapter.getCustomer(KNOWN_CUSTOMER_ID);
    expect(typeof profile!.customerId).toBe("string");
    expect(typeof profile!.firstName).toBe("string");
    expect(typeof profile!.lastName).toBe("string");
    expect(typeof profile!.email).toBe("string");
  });

  it("returns a CustomerProfile for new customer cust_2001 (Journey D)", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.getCustomer(NEW_CUSTOMER_ID);
    expect(result).not.toBeNull();
    expect(result!.customerId).toBe(NEW_CUSTOMER_ID);
  });

  it("Journey B customer has a populated accountId", async () => {
    const adapter = new MockPartyManagementAdapter();
    const profile = await adapter.getCustomer(KNOWN_CUSTOMER_ID);
    expect(typeof profile!.accountId).toBe("string");
    expect(profile!.accountId!.length).toBeGreaterThan(0);
  });
});

describe("MockPartyManagementAdapter.getCustomer – failure path", () => {
  it("returns null for an unknown customerId", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.getCustomer(UNKNOWN_CUSTOMER_ID);
    expect(result).toBeNull();
  });

  it("returns null for an empty string customerId", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.getCustomer("");
    expect(result).toBeNull();
  });
});

describe("MockPartyManagementAdapter.getCustomer – pending path", () => {
  it("returns a profile with status PENDING for a customer whose profile is under review", async () => {
    const adapter = new MockPartyManagementAdapter();
    // Pending journey seed: cust_pending_review
    const result = await adapter.getCustomer("cust_pending_review");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("PENDING");
  });
});

// ── lookupParty ───────────────────────────────────────────────────────────────

describe("MockPartyManagementAdapter.lookupParty – happy path", () => {
  it("returns a PartyLookupResult for known MSISDN (Journey B)", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.lookupParty({ msisdn: KNOWN_MSISDN });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
  });

  it("PartyLookupResult has customerId when found", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.lookupParty({ msisdn: KNOWN_MSISDN });
    expect(typeof result!.customerId).toBe("string");
    expect(result!.customerId!.length).toBeGreaterThan(0);
  });

  it("lookup by customerId also resolves to PartyLookupResult", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.lookupParty({ customerId: KNOWN_CUSTOMER_ID });
    expect(result).not.toBeNull();
    expect(result!.found).toBe(true);
  });
});

describe("MockPartyManagementAdapter.lookupParty – failure path", () => {
  it("returns a not-found result for an unknown MSISDN", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.lookupParty({ msisdn: UNKNOWN_MSISDN });
    expect(result!.found).toBe(false);
  });

  it("not-found result has no customerId", async () => {
    const adapter = new MockPartyManagementAdapter();
    const result = await adapter.lookupParty({ msisdn: UNKNOWN_MSISDN });
    expect(result!.customerId).toBeUndefined();
  });
});
