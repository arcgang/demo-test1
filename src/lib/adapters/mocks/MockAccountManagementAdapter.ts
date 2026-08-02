/**
 * Mock implementation of TMF666 AccountManagementAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey B — existing customer with active account (acc_1001 / cust_1001)
 *   Pending   — account with a suspended line (acc_suspended)
 *   Failure   — unknown account (acc_unknown_404)
 */

import type {
  AccountManagementAdapter,
  AccountSummary,
  AccountLine,
} from "@/lib/adapters/adapter-interfaces/AccountManagementAdapter";

const ACCOUNTS: Record<string, AccountSummary> = {
  acc_1001: {
    accountId: "acc_1001",
    customerId: "cust_1001",
    status: "ACTIVE",
    marketCode: "ZA",
  },
  acc_suspended: {
    accountId: "acc_suspended",
    customerId: "cust_3001",
    status: "ACTIVE",
    marketCode: "ZA",
  },
};

const ACCOUNT_LINES: Record<string, AccountLine[]> = {
  acc_1001: [
    {
      lineId: "msisdn_27831234567",
      msisdn: "27831234567",
      status: "ACTIVE",
      contractType: "CONTRACT",
      contractEndDate: "2024-12-31",
    },
  ],
  acc_suspended: [
    {
      lineId: "msisdn_27839999999",
      msisdn: "27839999999",
      status: "SUSPENDED",
      contractType: "CONTRACT",
    },
  ],
};

export class MockAccountManagementAdapter implements AccountManagementAdapter {
  async getAccount(accountId: string): Promise<AccountSummary | null> {
    if (!accountId) return null;
    return ACCOUNTS[accountId] ?? null;
  }

  async getAccountLines(accountId: string): Promise<AccountLine[]> {
    return ACCOUNT_LINES[accountId] ?? [];
  }
}
