/**
 * Acceptance tests: schema.prisma declares all 15 tables with correct structure.
 *
 * These tests parse the raw schema.prisma text. They FAIL until schema.prisma exists
 * with the correct models, field names, types, and relations.
 */

import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.prisma');

function readSchema(): string {
  if (!fs.existsSync(SCHEMA_PATH)) {
    throw new Error(`schema.prisma not found at ${SCHEMA_PATH}`);
  }
  return fs.readFileSync(SCHEMA_PATH, 'utf-8');
}

// Extract all model names declared in the schema
function extractModels(schema: string): string[] {
  const modelRegex = /^model\s+(\w+)\s*\{/gm;
  const models: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1]);
  }
  return models;
}

// Check whether a model block contains a specific field pattern
function modelContains(schema: string, modelName: string, pattern: RegExp): boolean {
  const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([^}]+)\\}`, 'ms');
  const m = modelRegex.exec(schema);
  if (!m) return false;
  return pattern.test(m[1]);
}

// ─── Required models (mapped to LLD §7.2 table names) ───────────────────────

const REQUIRED_MODELS: string[] = [
  'MarketConfig',
  'ProductCache',
  'CustomerSession',
  'Cart',
  'CartItem',
  'EligibilityResult',
  'FinanceQuote',
  'TradeInQuote',
  'VerificationCase',
  'PaymentAttempt',
  'ShopOrder',
  'OrderItem',
  'ActivationStatus',
  'ConsentRecord',
  'AuditEvent',
];

describe('schema.prisma – file presence', () => {
  it('schema.prisma exists at prisma/schema.prisma', () => {
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);
  });

  it('declares postgresql as the datasource provider', () => {
    const schema = readSchema();
    expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it('declares the prisma-client-js generator', () => {
    const schema = readSchema();
    expect(schema).toMatch(/provider\s*=\s*"prisma-client-js"/);
  });
});

describe('schema.prisma – all 15 models declared', () => {
  let models: string[];

  beforeAll(() => {
    models = extractModels(readSchema());
  });

  REQUIRED_MODELS.forEach((modelName) => {
    it(`declares model ${modelName}`, () => {
      expect(models).toContain(modelName);
    });
  });
});

describe('schema.prisma – UUID primary key on every model', () => {
  REQUIRED_MODELS.forEach((modelName) => {
    it(`${modelName} has a String id field with @id @default(uuid())`, () => {
      const schema = readSchema();
      // Accept id or the snake_case variant if mapped
      const hasPk =
        modelContains(schema, modelName, /id\s+String\s+@id\s+@default\(uuid\(\)\)/) ||
        modelContains(schema, modelName, /id\s+String\s+@default\(uuid\(\)\)\s+@id/);
      expect(hasPk).toBe(true);
    });
  });
});

describe('schema.prisma – timestamptz audit columns', () => {
  // All tables require createdAt; all except EligibilityResult and OrderItem require updatedAt
  const CREATED_AT_MODELS = REQUIRED_MODELS;
  const UPDATED_AT_MODELS = REQUIRED_MODELS.filter(
    (m) => m !== 'EligibilityResult' && m !== 'OrderItem' && m !== 'ConsentRecord' &&
            m !== 'FinanceQuote' && m !== 'TradeInQuote'
  );

  CREATED_AT_MODELS.forEach((modelName) => {
    it(`${modelName} has createdAt DateTime @default(now())`, () => {
      const schema = readSchema();
      const hasCreatedAt = modelContains(
        schema,
        modelName,
        /createdAt\s+DateTime\s+@default\(now\(\)\)/
      );
      expect(hasCreatedAt).toBe(true);
    });
  });

  UPDATED_AT_MODELS.forEach((modelName) => {
    it(`${modelName} has updatedAt DateTime @updatedAt`, () => {
      const schema = readSchema();
      const hasUpdatedAt = modelContains(schema, modelName, /updatedAt\s+DateTime\s+@updatedAt/);
      expect(hasUpdatedAt).toBe(true);
    });
  });
});

describe('schema.prisma – required fields per model (LLD §7.3)', () => {
  it('MarketConfig has marketCode as primary mapping, marketName, localeCode, currencyCode, taxLabel', () => {
    const schema = readSchema();
    // marketCode is the PK per DDL — in Prisma it may be mapped to id or be a separate field with @unique
    expect(schema).toMatch(/MarketConfig/);
    expect(modelContains(schema, 'MarketConfig', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /marketName\s+String/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /localeCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /currencyCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /taxLabel\s+String/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /mobileMoneyEnabled\s+Boolean/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /cardPaymentEnabled\s+Boolean/)).toBe(true);
    expect(modelContains(schema, 'MarketConfig', /liteModeDefault\s+Boolean/)).toBe(true);
  });

  it('ProductCache has productId, marketCode, productType, name, priceOnceOff, priceRecurring, availabilityStatus, metadataJson', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ProductCache', /productId\s+String/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /productType\s+String/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /name\s+String/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /priceOnceOff\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /priceRecurring\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /availabilityStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'ProductCache', /metadataJson\s+Json/)).toBe(true);
  });

  it('CustomerSession has sessionId, customerId (nullable), lineId (nullable), isAuthenticated, marketCode, expiresAt', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'CustomerSession', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'CustomerSession', /customerId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'CustomerSession', /lineId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'CustomerSession', /isAuthenticated\s+Boolean/)).toBe(true);
    expect(modelContains(schema, 'CustomerSession', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'CustomerSession', /expiresAt\s+DateTime/)).toBe(true);
  });

  it('Cart has sessionId, marketCode, status, currencyCode, and all monetary Decimal columns', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'Cart', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'Cart', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'Cart', /status\s+String/)).toBe(true);
    expect(modelContains(schema, 'Cart', /currencyCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'Cart', /onceOffSubtotal\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'Cart', /recurringSubtotal\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'Cart', /taxAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'Cart', /creditAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'Cart', /payableNow\s+Decimal/)).toBe(true);
  });

  it('CartItem has cartId, lineType, productId (nullable), displayName, quantity, monetary Decimal columns, metadataJson', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'CartItem', /cartId\s+String/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /lineType\s+String/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /productId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /displayName\s+String/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /quantity\s+Int/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /onceOffAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /recurringAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'CartItem', /metadataJson\s+Json/)).toBe(true);
  });

  it('EligibilityResult has sessionId, customerId, lineId, targetProductId, eligibilityStatus, reasonCode (nullable), compatiblePlansJson, inventoryStatus (nullable), evaluatedAt', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'EligibilityResult', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /customerId\s+String/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /lineId\s+String/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /targetProductId\s+String/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /eligibilityStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /reasonCode\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /compatiblePlansJson\s+Json/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /inventoryStatus\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'EligibilityResult', /evaluatedAt\s+DateTime/)).toBe(true);
  });

  it('FinanceQuote has sessionId, customerId, productId, marketCode, quoteStatus, optionsJson, expiresAt (nullable)', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'FinanceQuote', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /customerId\s+String/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /productId\s+String/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /quoteStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /optionsJson\s+Json/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /expiresAt\s+DateTime\?/)).toBe(true);
  });

  it('TradeInQuote has sessionId, customerId, marketCode, devicePayloadJson, quoteStatus, estimatedCredit, expiresAt (nullable)', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'TradeInQuote', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /customerId\s+String/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /devicePayloadJson\s+Json/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /quoteStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /estimatedCredit\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /expiresAt\s+DateTime\?/)).toBe(true);
  });

  it('VerificationCase has sessionId, marketCode, productType, customerPayloadJson, portingPayloadJson (nullable), verificationStatus, activationEligible, verificationReference (nullable)', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'VerificationCase', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /productType\s+String/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /customerPayloadJson\s+Json/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /portingPayloadJson\s+Json\?/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /verificationStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /activationEligible\s+Boolean/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /verificationReference\s+String\?/)).toBe(true);
  });

  it('PaymentAttempt has cartId, paymentMethod, providerName, providerReference (nullable), tokenReference (nullable), paymentStatus, amount, currencyCode, callbackPayloadJson (nullable)', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'PaymentAttempt', /cartId\s+String/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /paymentMethod\s+String/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /providerName\s+String/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /providerReference\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /tokenReference\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /paymentStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /amount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /currencyCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'PaymentAttempt', /callbackPayloadJson\s+Json\?/)).toBe(true);
  });

  it('ShopOrder has cartId, sessionId, customerId (nullable), marketCode, externalOrderReference (nullable), orderStatus, paymentStatus, verificationStatus (nullable), activationStatus (nullable), totalAmount, currencyCode', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ShopOrder', /cartId\s+String/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /customerId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /marketCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /externalOrderReference\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /orderStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /paymentStatus\s+String/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /verificationStatus\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /activationStatus\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /totalAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /currencyCode\s+String/)).toBe(true);
  });

  it('OrderItem has orderId, lineType, productId (nullable), displayName, quantity, monetary Decimal columns, metadataJson', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'OrderItem', /orderId\s+String/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /lineType\s+String/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /productId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /displayName\s+String/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /quantity\s+Int/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /onceOffAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /recurringAmount\s+Decimal/)).toBe(true);
    expect(modelContains(schema, 'OrderItem', /metadataJson\s+Json/)).toBe(true);
  });

  it('ActivationStatus has orderId, activationState, esimReference (nullable), esimQrPayload (nullable), milestonePayloadJson', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ActivationStatus', /orderId\s+String/)).toBe(true);
    expect(modelContains(schema, 'ActivationStatus', /activationState\s+String/)).toBe(true);
    expect(modelContains(schema, 'ActivationStatus', /esimReference\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ActivationStatus', /esimQrPayload\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ActivationStatus', /milestonePayloadJson\s+Json/)).toBe(true);
  });

  it('ConsentRecord has sessionId, customerId (nullable), purposeCode, granted, sourceChannel, recordedAt', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ConsentRecord', /sessionId\s+String/)).toBe(true);
    expect(modelContains(schema, 'ConsentRecord', /customerId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'ConsentRecord', /purposeCode\s+String/)).toBe(true);
    expect(modelContains(schema, 'ConsentRecord', /granted\s+Boolean/)).toBe(true);
    expect(modelContains(schema, 'ConsentRecord', /sourceChannel\s+String/)).toBe(true);
    expect(modelContains(schema, 'ConsentRecord', /recordedAt\s+DateTime/)).toBe(true);
  });

  it('AuditEvent has sessionId (nullable), orderId (nullable), eventType, eventCategory, actorType, actorId (nullable), payloadJson, occurredAt', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'AuditEvent', /sessionId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /orderId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /eventType\s+String/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /eventCategory\s+String/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /actorType\s+String/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /actorId\s+String\?/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /payloadJson\s+Json/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /occurredAt\s+DateTime/)).toBe(true);
  });
});

describe('schema.prisma – foreign key relations', () => {
  it('ProductCache has a relation to MarketConfig via marketCode', () => {
    const schema = readSchema();
    // Relation field or @relation referencing MarketConfig
    expect(modelContains(schema, 'ProductCache', /MarketConfig/)).toBe(true);
  });

  it('CustomerSession has a relation to MarketConfig via marketCode', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'CustomerSession', /MarketConfig/)).toBe(true);
  });

  it('Cart has relations to CustomerSession and MarketConfig', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'Cart', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'Cart', /MarketConfig/)).toBe(true);
  });

  it('CartItem has a relation to Cart with onDelete: Cascade', () => {
    const schema = readSchema();
    // Prisma expresses cascade as onDelete: Cascade in @relation
    const cartItemBlock = schema.match(/model\s+CartItem\s*\{([^}]+)\}/ms)?.[1] ?? '';
    expect(cartItemBlock).toMatch(/onDelete:\s*Cascade/);
  });

  it('EligibilityResult has a relation to CustomerSession', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'EligibilityResult', /CustomerSession/)).toBe(true);
  });

  it('FinanceQuote has relations to CustomerSession and MarketConfig', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'FinanceQuote', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'FinanceQuote', /MarketConfig/)).toBe(true);
  });

  it('TradeInQuote has relations to CustomerSession and MarketConfig', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'TradeInQuote', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'TradeInQuote', /MarketConfig/)).toBe(true);
  });

  it('VerificationCase has relations to CustomerSession and MarketConfig', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'VerificationCase', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'VerificationCase', /MarketConfig/)).toBe(true);
  });

  it('PaymentAttempt has a relation to Cart', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'PaymentAttempt', /Cart/)).toBe(true);
  });

  it('ShopOrder has relations to Cart, CustomerSession, and MarketConfig', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ShopOrder', /Cart/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'ShopOrder', /MarketConfig/)).toBe(true);
  });

  it('OrderItem has a relation to ShopOrder with onDelete: Cascade', () => {
    const schema = readSchema();
    const orderItemBlock = schema.match(/model\s+OrderItem\s*\{([^}]+)\}/ms)?.[1] ?? '';
    expect(orderItemBlock).toMatch(/onDelete:\s*Cascade/);
  });

  it('ActivationStatus has a relation to ShopOrder', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ActivationStatus', /ShopOrder/)).toBe(true);
  });

  it('ConsentRecord has a relation to CustomerSession', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'ConsentRecord', /CustomerSession/)).toBe(true);
  });

  it('AuditEvent has optional relations to CustomerSession and ShopOrder', () => {
    const schema = readSchema();
    expect(modelContains(schema, 'AuditEvent', /CustomerSession/)).toBe(true);
    expect(modelContains(schema, 'AuditEvent', /ShopOrder/)).toBe(true);
  });
});

describe('schema.prisma – table name mappings', () => {
  // Prisma model names are PascalCase; the DDL uses snake_case. Verify @@map entries.
  const TABLE_MAP: Record<string, string> = {
    MarketConfig: 'market_config',
    ProductCache: 'product_cache',
    CustomerSession: 'customer_session',
    Cart: 'cart',
    CartItem: 'cart_item',
    EligibilityResult: 'eligibility_result',
    FinanceQuote: 'finance_quote',
    TradeInQuote: 'trade_in_quote',
    VerificationCase: 'verification_case',
    PaymentAttempt: 'payment_attempt',
    ShopOrder: 'shop_order',
    OrderItem: 'order_item',
    ActivationStatus: 'activation_status',
    ConsentRecord: 'consent_record',
    AuditEvent: 'audit_event',
  };

  Object.entries(TABLE_MAP).forEach(([model, table]) => {
    it(`${model} maps to table "${table}" via @@map`, () => {
      const schema = readSchema();
      const block = schema.match(new RegExp(`model\\s+${model}\\s*\\{([^}]+)\\}`, 'ms'))?.[1] ?? '';
      expect(block).toMatch(new RegExp(`@@map\\(["']${table}["']\\)`));
    });
  });
});
