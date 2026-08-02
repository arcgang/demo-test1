/**
 * Mock implementation of TMF663 ShoppingCartAdapter (NFR-32, ADR-003, IR-04).
 *
 * Deterministic seeded data covering all four demo journeys:
 *   Journey B — compatible device + plan cart (cart_8f3a)
 *   Journey B + trade-in — cart with TRADE_IN_CREDIT line (cart_with_tradein)
 *   Failure   — incompatible device + plan (cart_bad_combo)
 *   Edge      — empty cart (no lines → incompatible)
 *
 * Compatible plans for prod_device_iphone15 (VAL-03 rule):
 *   plan_unlimited_20gb, plan_red_premium
 */

import type {
  ShoppingCartAdapter,
  CartExportRequest,
  CartExportResult,
  CartCompatibilityRequest,
  CartCompatibilityResult,
} from "@/lib/adapters/adapter-interfaces/ShoppingCartAdapter";

/** Plans that are compatible with each device product ID. */
const DEVICE_COMPATIBLE_PLANS: Record<string, Set<string>> = {
  prod_device_iphone15: new Set(["plan_unlimited_20gb", "plan_red_premium"]),
  prod_device_samsung_s24: new Set(["plan_tz_20gb", "plan_unlimited_20gb"]),
};

export class MockShoppingCartAdapter implements ShoppingCartAdapter {
  async exportCartMapping(request: CartExportRequest): Promise<CartExportResult> {
    const mappedLines = request.lines.map((line, index) => ({
      lineType: line.lineType,
      externalReference: `ext_ref_${request.cartId}_${index}`,
      productId: line.productId,
      referenceId: line.referenceId,
    }));
    return { cartId: request.cartId, mappedLines };
  }

  async validateCartCompatibility(request: CartCompatibilityRequest): Promise<CartCompatibilityResult> {
    if (request.lines.length === 0) {
      return {
        compatible: false,
        violations: [{ ruleCode: "VAL-EMPTY-CART", message: "Cart must contain at least one product line." }],
      };
    }

    const deviceLine = request.lines.find((l) => l.lineType === "DEVICE");
    const planLine = request.lines.find((l) => l.lineType === "PLAN");

    if (deviceLine && planLine && deviceLine.productId && planLine.productId) {
      const compatiblePlans = DEVICE_COMPATIBLE_PLANS[deviceLine.productId];
      if (compatiblePlans && !compatiblePlans.has(planLine.productId)) {
        return {
          compatible: false,
          violations: [
            {
              ruleCode: "VAL-03",
              message: `Plan '${planLine.productId}' is not compatible with device '${deviceLine.productId}'.`,
            },
          ],
        };
      }
    }

    return { compatible: true, violations: [] };
  }
}
