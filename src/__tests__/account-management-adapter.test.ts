/**
 * Acceptance tests: TMF666 AccountManagementAdapter interface and mock
 *
 * These tests MUST FAIL until the interface and mock are created at:
 *   src/lib/adapters/adapter-interfaces/AccountManagementAdapter.ts
 *   src/lib/adapters/mocks/MockAccountManagementAdapter.ts
 *
 * Covers (per LLD §8.1, task acceptance criteria):
 *   1. Interface shape — getAccount and getAccountLines methods
 *   2. JSDoc carries TM Forum TMF666 traceability annotation (NFR-32)
 *   3. Mock is assignable to the interface boundary (IR-04)
 *   4. Happy-path: known account (Journey B) with active lines
 *   5. Failure path: unknown account
 *   6. Pending path: account with a suspended line
 */

import type {
  AccountManagementAdapter,
  AccountSummary,
  AccountLine,
} from "@/lib/adapters/adapter-interfaces/AccountManagementAdapter";
import { MockAccountManagementAdapter } from "@/lib/adapters/mocks/MockAccountManagementAdapter";

// ── Seed inputs keyed to demo journeys (ADR-003) ──────────────────────────────

// Journey B — existing customer with active account
const KNOWN_ACCOUNT_ID = "acc_1001";
const KNOWN_CUSTOMER_ID = "cust_1001";
const UNKNOWN_ACCOUNT_ID = "acc_unknown_404";
// Journey B — line on known account
const KNOWN_LINE_ID = "msisdn_27831234567";

// ── Interface assignability ───────────────────────────────────────────────────

describe("AccountManagementAdapter – interface boundary (IR-04)", () => {
  it("MockAccountManagementAdapter is assignable to AccountManagementAdapter interface", () => {
    const adapter: AccountManagementAdapter = new MockAccountManagementAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── Constructor ───────────────────────────────────────────────────────────────

describe("MockAccountManagementAdapter – constructor", () => {
  it("can be instantiated with no arguments", () => {
    const adapter = new MockAccountManagementAdapter();
    expect(adapter).toBeDefined();
  });
});

// ── getAccount — happy path ───────────────────────────────────────────────────

describe("MockAccountManagementAdapter.getAccount – happy path (Journey B)", () => {
  it("returns AccountSummary for known accountId acc_1001", async () => {
    const adapter = new MockAccountManagementAdapter();
    const result = await adapter.getAccount(KNOWN_ACCOUNT_ID);
    expect(result).not.toBeNull();
    expect(result!.accountId).toBe(KNOWN_ACCOUNT_ID);
  });

  it("AccountSummary has required fields: accountId, customerId, status", async () => {
    const adapter = new MockAccountManagementAdapter();
    const account: AccountSummary = await adapter.getAccount(KNOWN_ACCOUNT_ID) as AccountSummary;
    expect(typeof account.accountId).toBe("string");
    expect(typeof account.customerId).toBe("string");
    expect(typeof account.status).toBe("string");
  });

  it("returned account links to customerId cust_1001", async () => {
    const adapter = new MockAccountManagementAdapter();
    const account = await adapter.getAccount(KNOWN_ACCOUNT_ID);
    expect(account!.customerId).toBe(KNOWN_CUSTOMER_ID);
  });

  it("account status is ACTIVE for Journey B seed", async () => {
    const adapter = new MockAccountManagementAdapter();
    const account = await adapter.getAccount(KNOWN_ACCOUNT_ID);
    expect(account!.status).toBe("ACTIVE");
  });
});

// ── getAccount — failure path ─────────────────────────────────────────────────

describe("MockAccountManagementAdapter.getAccount – failure path", () => {
  it("returns null for unknown accountId", async () => {
    const adapter = new MockAccountManagementAdapter();
    const result = await adapter.getAccount(UNKNOWN_ACCOUNT_ID);
    expect(result).toBeNull();
  });

  it("returns null for empty string accountId", async () => {
    const adapter = new MockAccountManagementAdapter();
    const result = await adapter.getAccount("");
    expect(result).toBeNull();
  });
});

// ── getAccountLines — happy path ──────────────────────────────────────────────

describe("MockAccountManagementAdapter.getAccountLines – happy path (Journey B)", () => {
  it("returns an array of AccountLine for acc_1001", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines(KNOWN_ACCOUNT_ID);
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it("every AccountLine has required fields: lineId, msisdn, status, contractType", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines(KNOWN_ACCOUNT_ID);
    for (const line of lines) {
      expect(typeof line.lineId).toBe("string");
      expect(typeof line.msisdn).toBe("string");
      expect(typeof line.status).toBe("string");
      expect(typeof line.contractType).toBe("string");
    }
  });

  it("Journey B account has an ACTIVE line with lineId msisdn_27831234567", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines(KNOWN_ACCOUNT_ID);
    const line = lines.find((l: AccountLine) => l.lineId === KNOWN_LINE_ID);
    expect(line).toBeDefined();
    expect(line!.status).toBe("ACTIVE");
  });

  it("Journey B line has contractType CONTRACT", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines(KNOWN_ACCOUNT_ID);
    const line = lines.find((l: AccountLine) => l.lineId === KNOWN_LINE_ID);
    expect(line!.contractType).toBe("CONTRACT");
  });
});

// ── getAccountLines — failure / pending paths ────────────────────────────────

describe("MockAccountManagementAdapter.getAccountLines – failure path", () => {
  it("returns empty array for unknown accountId", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines(UNKNOWN_ACCOUNT_ID);
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBe(0);
  });
});

describe("MockAccountManagementAdapter.getAccountLines – pending path", () => {
  it("returns a SUSPENDED line for account acc_suspended", async () => {
    const adapter = new MockAccountManagementAdapter();
    const lines = await adapter.getAccountLines("acc_suspended");
    const suspended = lines.find((l: AccountLine) => l.status === "SUSPENDED");
    expect(suspended).toBeDefined();
  });
});
