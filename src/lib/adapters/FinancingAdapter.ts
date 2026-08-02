/**
 * FinancingAdapter — integration boundary for the external Financing Service.
 *
 * Business capability: retrieve indicative financing options and submit
 * formal applications for device purchase on installment plans, keyed to
 * upgrade journey inputs such as product, down payment, and tenure.
 *
 * Compliance domain: consumer credit disclosure obligations; monthly amounts
 * are indicative and labelled accordingly until final approval (LLD §5.8,
 * IR-04, NFR-32).
 *
 * All implementations must be substitutable without changing domain service
 * logic (IR-04).
 */

/** Input to retrieve available financing options for a product. */
export interface FinancingOptionsInput {
  customerId: string;
  productId: string;
  marketCode: string;
  /** Zero indicates no down payment. */
  downPaymentAmount: number;
}

/** A single indicative financing option returned in a quote. */
export interface FinancingOption {
  tenureMonths: number;
  monthlyAmount: number;
  interestLabel: string;
  requiresFinalApproval: boolean;
}

/** Result returned by getFinancingOptions. */
export interface FinancingOptionsResult {
  financeQuoteId: string;
  /** QUOTED when options are available. */
  status: string;
  options: FinancingOption[];
}

/** Input to calculate a single monthly payment amount without a full quote. */
export interface MonthlyPaymentInput {
  productId: string;
  marketCode: string;
  tenureMonths: number;
  downPaymentAmount: number;
}

/** Result of a monthly payment calculation. */
export interface MonthlyPaymentResult {
  monthlyAmount: number;
  tenureMonths: number;
}

/** Input for submitting a formal financing application. */
export interface FinancingApplicationInput {
  customerId: string;
  productId: string;
  marketCode: string;
  financeQuoteId: string;
  tenureMonths: number;
  downPaymentAmount: number;
}

/** Outcome of a financing application submission. */
export interface FinancingApplicationResult {
  /** APPROVED | DECLINED | PENDING */
  applicationStatus: string;
  applicationReference: string;
  reason?: string;
}

/**
 * FinancingAdapter — contract for financing service interactions.
 *
 * Used by FinancingModule to serve upgrade journey financing options and
 * submit applications after customer selection.
 */
export interface FinancingAdapter {
  /** Retrieve a set of indicative financing options for a product purchase. */
  getFinancingOptions(input: FinancingOptionsInput): Promise<FinancingOptionsResult>;

  /** Calculate the monthly payment for a specific tenure and down payment. */
  calculateMonthlyPayment(input: MonthlyPaymentInput): Promise<MonthlyPaymentResult>;

  /** Submit a formal financing application for final approval. */
  submitFinancingApplication(input: FinancingApplicationInput): Promise<FinancingApplicationResult>;
}
