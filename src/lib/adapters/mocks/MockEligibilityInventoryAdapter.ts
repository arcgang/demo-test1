/**
 * Mock implementation of TMF637 EligibilityInventoryAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey B — eligible upgrade (cust_1001 / msisdn_27831234567)
 *   Failure   — ineligible customer outside upgrade window (cust_3001)
 *   Pending   — upgrade date in the future (cust_4001)
 *   Inventory — in-stock (prod_device_iphone15), out-of-stock, not-found
 */

import type {
  EligibilityInventoryAdapter,
  EligibilityCheckRequest,
  EligibilityCheckResult,
  InventoryAvailabilityRequest,
  InventoryAvailabilityResult,
} from "@/lib/adapters/adapter-interfaces/EligibilityInventoryAdapter";

const ELIGIBLE_CUSTOMER_IDS = new Set(["cust_1001"]);
const PENDING_CUSTOMER_IDS = new Set(["cust_4001"]);

const INVENTORY_TABLE: Record<string, "IN_STOCK" | "OUT_OF_STOCK"> = {
  prod_device_iphone15: "IN_STOCK",
  prod_device_samsung_s24: "IN_STOCK",
  prod_device_outofstock: "OUT_OF_STOCK",
};

export class MockEligibilityInventoryAdapter implements EligibilityInventoryAdapter {
  async checkUpgradeEligibility(request: EligibilityCheckRequest): Promise<EligibilityCheckResult> {
    if (ELIGIBLE_CUSTOMER_IDS.has(request.customerId)) {
      return {
        eligibilityStatus: "ELIGIBLE",
        reasonCode: "UPGRADE_WINDOW_OPEN",
        nextEligibleDate: null,
        compatiblePlans: ["plan_unlimited_20gb", "plan_red_premium"],
        inventoryStatus: "IN_STOCK",
      };
    }

    if (PENDING_CUSTOMER_IDS.has(request.customerId)) {
      return {
        eligibilityStatus: "PENDING_ELIGIBILITY_DATE",
        reasonCode: "UPGRADE_WINDOW_NOT_YET_OPEN",
        nextEligibleDate: "2027-01-15T00:00:00Z",
        compatiblePlans: [],
        inventoryStatus: null,
      };
    }

    // Ineligible — default failure path
    return {
      eligibilityStatus: "INELIGIBLE",
      reasonCode: "CONTRACT_NOT_EXPIRED",
      nextEligibleDate: null,
      compatiblePlans: [],
      inventoryStatus: null,
    };
  }

  async checkInventoryAvailability(request: InventoryAvailabilityRequest): Promise<InventoryAvailabilityResult> {
    const status = INVENTORY_TABLE[request.productId];
    if (!status) {
      return { productId: request.productId, marketCode: request.marketCode, inventoryStatus: "NOT_FOUND" };
    }
    return { productId: request.productId, marketCode: request.marketCode, inventoryStatus: status };
  }
}
