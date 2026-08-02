/**
 * TMF637 Eligibility and Inventory — adapter interface (NFR-32)
 *
 * Represents the TM Forum TMF637 Product Offering Qualification and inventory
 * availability resource model. Checks upgrade eligibility for existing customers
 * and inventory availability for target products. Mock implementations must be
 * replaceable without touching domain service logic (IR-04).
 */

/** Input for an upgrade eligibility check (LLD §5.7). */
export interface EligibilityCheckRequest {
  customerId: string;
  lineId: string;
  targetProductId: string;
  marketCode: string;
}

/** Result of an upgrade eligibility check (LLD §5.7). */
export interface EligibilityCheckResult {
  /** ELIGIBLE | INELIGIBLE | PENDING_ELIGIBILITY_DATE */
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "PENDING_ELIGIBILITY_DATE" | string;
  reasonCode: string | null;
  nextEligibleDate: string | null;
  compatiblePlans: string[];
  inventoryStatus: string | null;
}

/** Input for a product inventory availability check. */
export interface InventoryAvailabilityRequest {
  productId: string;
  marketCode: string;
}

/** Result of a product inventory availability check. */
export interface InventoryAvailabilityResult {
  productId: string;
  marketCode: string;
  /** IN_STOCK | OUT_OF_STOCK | NOT_FOUND */
  inventoryStatus: "IN_STOCK" | "OUT_OF_STOCK" | "NOT_FOUND" | string;
}

/**
 * TMF637 EligibilityInventoryAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface EligibilityInventoryAdapter {
  /** Check whether a customer and line are eligible for an upgrade to the target product. */
  checkUpgradeEligibility(request: EligibilityCheckRequest): Promise<EligibilityCheckResult>;

  /** Check inventory availability for a product in a given market. */
  checkInventoryAvailability(request: InventoryAvailabilityRequest): Promise<InventoryAvailabilityResult>;
}
