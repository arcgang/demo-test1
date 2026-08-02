/**
 * TMF666 Account Management — adapter interface (NFR-32)
 *
 * Represents the TM Forum TMF666 Account Management resource model concerns.
 * Provides account summary and line retrieval for existing customers on the
 * upgrade journey. Mock implementations must be replaceable without touching
 * domain service logic (IR-04).
 */

/** Summary of a billing/service account (TMF666 PartyAccount). */
export interface AccountSummary {
  accountId: string;
  customerId: string;
  /** ACTIVE | SUSPENDED | CLOSED */
  status: "ACTIVE" | "SUSPENDED" | "CLOSED" | string;
  marketCode?: string;
}

/** A single service line on an account (TMF666 BillingAccount sub-resource). */
export interface AccountLine {
  lineId: string;
  msisdn: string;
  /** ACTIVE | SUSPENDED | CANCELLED */
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | string;
  /** CONTRACT | PREPAID */
  contractType: "CONTRACT" | "PREPAID" | string;
  contractEndDate?: string;
}

/**
 * TMF666 AccountManagementAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface AccountManagementAdapter {
  /** Retrieve an account summary by accountId, or null if not found. */
  getAccount(accountId: string): Promise<AccountSummary | null>;

  /** Retrieve all service lines associated with an account. */
  getAccountLines(accountId: string): Promise<AccountLine[]>;
}
