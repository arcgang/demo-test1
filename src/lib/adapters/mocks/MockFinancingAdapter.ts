import type {
  FinancingAdapter,
  FinancingOptionsInput,
  FinancingOptionsResult,
  FinancingOption,
  MonthlyPaymentInput,
  MonthlyPaymentResult,
  FinancingApplicationInput,
  FinancingApplicationResult,
} from "@/lib/adapters/FinancingAdapter";

type ApplicationScenario = "approved" | "declined" | "pending";

interface MockFinancingAdapterOptions {
  scenario?: ApplicationScenario;
}

/** Base prices used when the product has no explicit seeded entry. */
const DEFAULT_DEVICE_PRICE = 18999;

/** Seeded device prices keyed by productId (LLD §5.8). */
const DEVICE_PRICES: Record<string, number> = {
  prod_device_iphone15pro: 24999,
  prod_device_s24ultra: 22999,
  prod_device_iphone15: 18999,
  prod_device_s24: 16999,
  prod_device_iphone14: 15999,
  prod_device_a54: 8999,
};

/** Annual interest rate used for indicative calculations. */
const INDICATIVE_RATE = 0.15;

function calcMonthly(devicePrice: number, downPayment: number, tenureMonths: number): number {
  const principal = Math.max(0, devicePrice - downPayment);
  const monthlyRate = INDICATIVE_RATE / 12;
  if (monthlyRate === 0) return Math.round((principal / tenureMonths) * 100) / 100;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(payment * 100) / 100;
}

let quoteCounter = 450;

/**
 * MockFinancingAdapter — seeded financing adapter for demo and testing.
 *
 * Returns deterministic option sets keyed to productId and downPaymentAmount.
 * Covers approved, declined, and pending application scenarios (LLD §5.8,
 * IR-04).
 */
export class MockFinancingAdapter implements FinancingAdapter {
  private readonly scenario: ApplicationScenario;

  constructor(options: MockFinancingAdapterOptions = {}) {
    this.scenario = options.scenario ?? "approved";
  }

  async getFinancingOptions(input: FinancingOptionsInput): Promise<FinancingOptionsResult> {
    const price = DEVICE_PRICES[input.productId] ?? DEFAULT_DEVICE_PRICE;
    const down = input.downPaymentAmount ?? 0;

    const options: FinancingOption[] = [12, 24, 36].map((tenure) => ({
      tenureMonths: tenure,
      monthlyAmount: calcMonthly(price, down, tenure),
      interestLabel: "Indicative",
      requiresFinalApproval: true,
    }));

    quoteCounter += 1;
    return {
      financeQuoteId: `fin_${quoteCounter}`,
      status: "QUOTED",
      options,
    };
  }

  async calculateMonthlyPayment(input: MonthlyPaymentInput): Promise<MonthlyPaymentResult> {
    const price = DEVICE_PRICES[input.productId] ?? DEFAULT_DEVICE_PRICE;
    return {
      monthlyAmount: calcMonthly(price, input.downPaymentAmount ?? 0, input.tenureMonths),
      tenureMonths: input.tenureMonths,
    };
  }

  async submitFinancingApplication(
    input: FinancingApplicationInput
  ): Promise<FinancingApplicationResult> {
    if (this.scenario === "approved") {
      return {
        applicationStatus: "APPROVED",
        applicationReference: `fapp_${input.financeQuoteId}_approved`,
      };
    }
    if (this.scenario === "declined") {
      return {
        applicationStatus: "DECLINED",
        applicationReference: `fapp_${input.financeQuoteId}_declined`,
        reason: "Credit score below minimum threshold.",
      };
    }
    return {
      applicationStatus: "PENDING",
      applicationReference: `fapp_${input.financeQuoteId}_pending`,
    };
  }
}
