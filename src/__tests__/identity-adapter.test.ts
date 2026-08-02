/**
 * Acceptance tests: IdentityAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/IdentityAdapter.ts
 *   src/lib/adapters/mocks/MockIdentityAdapter.ts
 *
 * Covers (per LLD §4.3, §8.1, task acceptance criteria):
 *   1. Interface shape — authenticateCustomer and lookupIdentity methods
 *   2. JSDoc carries Identity Service traceability annotation (NFR-32)
 *   3. Mock is assignable to the interface boundary (IR-04)
 *   4. Happy-path: valid credentials (Journey B upgrade) → authenticated session
 *   5. Failure path: invalid credentials → authentication rejected
 *   6. Pending path: account locked / requires additional verification
 */

import type {
  IdentityAdapter,
  AuthenticationRequest,
  AuthenticationResult,
  IdentityLookupRequest,
  IdentityLookupResult,
} from "@/lib/adapters/adapter-interfaces/IdentityAdapter";
import { MockIdentityAdapter } from "@/lib/adapters/mocks/MockIdentityAdapter";

// ── Seed inputs keyed to demo journeys (ADR-003) ──────────────────────────────

// Journey B — valid authenticated customer
const VALID_CREDENTIALS: AuthenticationRequest = {
  customerId: "cust_1001",
  credential: "valid_token_cust_1001",
  marketCode: "ZA",
};

// Invalid credentials
const INVALID_CREDENTIALS: AuthenticationRequest = {
  customerId: "cust_1001",
  credential: "wrong_credential",
  marketCode: "ZA",
};

// Pending: account requires 2FA / step-up
const PENDING_CREDENTIALS: AuthenticationRequest = {
  customerId: "cust_locked_pending",
  credential: "valid_token_cust_locked",
  marketCode: "ZA",
};

// Identity lookup — known MSISDN (Journey B)
const KNOWN_LOOKUP: IdentityLookupRequest = {
  msisdn: "27831234567",
  marketCode: "ZA",
};

// Identity lookup — unknown MSISDN
const UNKNOWN_LOOKUP: IdentityLookupRequest = {
  msisdn: "0000000000",
  marketCode: "ZA",
};

// ── Interface assignability ───────────────────────────────────────────────────

describe("IdentityAdapter – interface boundary (IR-04)", () => {
  it("MockIdentityAdapter is assignable to IdentityAdapter interface", () => {
    const adapter: IdentityAdapter = new MockIdentityAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockIdentityAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockIdentityAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── authenticateCustomer — happy path ─────────────────────────────────────────

describe("MockIdentityAdapter.authenticateCustomer – happy path (Journey B)", () => {
  it("returns authenticated: true for valid credentials", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(VALID_CREDENTIALS);
    expect(result.authenticated).toBe(true);
  });

  it("successful result includes a sessionToken", async () => {
    const adapter = new MockIdentityAdapter();
    const result: AuthenticationResult = await adapter.authenticateCustomer(VALID_CREDENTIALS);
    expect(typeof result.sessionToken).toBe("string");
    expect(result.sessionToken!.length).toBeGreaterThan(0);
  });

  it("successful result includes the resolved customerId", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(VALID_CREDENTIALS);
    expect(result.customerId).toBe("cust_1001");
  });

  it("result has no error on success", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(VALID_CREDENTIALS);
    expect(result.error).toBeUndefined();
  });
});

// ── authenticateCustomer — failure path ───────────────────────────────────────

describe("MockIdentityAdapter.authenticateCustomer – failure path", () => {
  it("returns authenticated: false for invalid credentials", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(INVALID_CREDENTIALS);
    expect(result.authenticated).toBe(false);
  });

  it("failed result has no sessionToken", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(INVALID_CREDENTIALS);
    expect(result.sessionToken).toBeUndefined();
  });

  it("failed result carries an error code or message", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(INVALID_CREDENTIALS);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe("string");
    expect(result.error!.length).toBeGreaterThan(0);
  });
});

// ── authenticateCustomer — pending path ───────────────────────────────────────

describe("MockIdentityAdapter.authenticateCustomer – pending path", () => {
  it("returns authenticated: false with STEP_UP_REQUIRED error for locked account", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.authenticateCustomer(PENDING_CREDENTIALS);
    expect(result.authenticated).toBe(false);
    expect(result.error).toBe("STEP_UP_REQUIRED");
  });
});

// ── lookupIdentity — happy path ───────────────────────────────────────────────

describe("MockIdentityAdapter.lookupIdentity – happy path (Journey B)", () => {
  it("returns a found IdentityLookupResult for known MSISDN", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.lookupIdentity(KNOWN_LOOKUP);
    expect(result.found).toBe(true);
  });

  it("found result includes customerId", async () => {
    const adapter = new MockIdentityAdapter();
    const result: IdentityLookupResult = await adapter.lookupIdentity(KNOWN_LOOKUP);
    expect(typeof result.customerId).toBe("string");
    expect(result.customerId!.length).toBeGreaterThan(0);
  });

  it("found result includes marketCode", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.lookupIdentity(KNOWN_LOOKUP);
    expect(result.marketCode).toBe("ZA");
  });
});

// ── lookupIdentity — failure path ────────────────────────────────────────────

describe("MockIdentityAdapter.lookupIdentity – failure path", () => {
  it("returns found: false for unknown MSISDN", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.lookupIdentity(UNKNOWN_LOOKUP);
    expect(result.found).toBe(false);
  });

  it("not-found result has no customerId", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.lookupIdentity(UNKNOWN_LOOKUP);
    expect(result.customerId).toBeUndefined();
  });

  it("returns found: false for empty MSISDN", async () => {
    const adapter = new MockIdentityAdapter();
    const result = await adapter.lookupIdentity({ msisdn: "", marketCode: "ZA" });
    expect(result.found).toBe(false);
  });
});
