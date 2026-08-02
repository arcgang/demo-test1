/**
 * TMF663 Shopping Cart — adapter interface (NFR-32)
 *
 * Represents the TM Forum TMF663 Shopping Cart resource model.
 * Provides cart export mapping to external ordering systems and
 * compatibility validation for device/plan combinations. Mock
 * implementations must be replaceable without touching domain service
 * logic (IR-04).
 */

/** A single line item within a cart export or compatibility request. */
export interface CartLineInput {
  lineType: "DEVICE" | "PLAN" | "BUNDLE" | "ACCESSORY" | "TRADE_IN_CREDIT" | "FINANCE" | string;
  productId?: string;
  referenceId?: string;
  quantity: number;
}

/** Request to export a cart's line items to an external ordering format. */
export interface CartExportRequest {
  cartId: string;
  marketCode: string;
  lines: CartLineInput[];
}

/** A single mapped line in the export result. */
export interface MappedCartLine {
  lineType: string;
  externalReference: string;
  productId?: string;
  referenceId?: string;
}

/** Result of a cart export mapping operation. */
export interface CartExportResult {
  cartId: string;
  mappedLines: MappedCartLine[];
}

/** A compatibility rule violation. */
export interface CartViolation {
  ruleCode: string;
  message: string;
}

/** Request to validate device/plan compatibility for a cart (VAL-03). */
export interface CartCompatibilityRequest {
  cartId: string;
  marketCode: string;
  lines: CartLineInput[];
}

/** Result of a cart compatibility validation. */
export interface CartCompatibilityResult {
  compatible: boolean;
  violations: CartViolation[];
}

/**
 * TMF663 ShoppingCartAdapter — interface boundary (IR-04).
 * Domain services depend only on this interface; mocks are swapped without
 * changing any caller.
 */
export interface ShoppingCartAdapter {
  /** Map internal cart lines to an external ordering system representation. */
  exportCartMapping(request: CartExportRequest): Promise<CartExportResult>;

  /** Validate device/plan/bundle combination compatibility rules (VAL-03). */
  validateCartCompatibility(request: CartCompatibilityRequest): Promise<CartCompatibilityResult>;
}
