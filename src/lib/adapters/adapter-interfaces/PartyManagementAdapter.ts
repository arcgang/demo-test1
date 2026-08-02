/**
 * TMF632 Party Management — adapter interface (NFR-32)
 *
 * Represents the TM Forum TMF632 Party Management resource model.
 * Provides customer profile lookup and party resolution by MSISDN or
 * customer identifier. Mock implementations must be replaceable without
 * touching domain service logic (IR-04).
 */

/** Customer profile returned from TMF632 Individual/Customer resource. */
export interface CustomerProfile {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Associated billing account identifier, if present. */
  accountId?: string;
  /** Profile lifecycle status: ACTIVE | PENDING | SUSPENDED */
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | string;
}

/** Input for a party lookup by MSISDN or customer identifier. */
export interface PartyLookupInput {
  msisdn?: string;
  customerId?: string;
}

/** Result of a TMF632 party lookup. */
export interface PartyLookupResult {
  found: boolean;
  customerId?: string;
  marketCode?: string;
}

/**
 * TMF632 PartyManagementAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface PartyManagementAdapter {
  /** Retrieve a full customer profile by customerId, or null if not found. */
  getCustomer(customerId: string): Promise<CustomerProfile | null>;

  /** Look up a party by MSISDN or customerId and return a resolved result. */
  lookupParty(input: PartyLookupInput): Promise<PartyLookupResult>;
}
