/**
 * Acceptance tests: ConsentAuditAdapter interface and MockConsentAuditAdapter
 * — verifies recordConsentEvent, recordAuditEvent, queryAuditTrail produce
 *   structured AuditEvent and ConsentRecord objects conforming to the
 *   schema-defined shape for POPIA compliance (LLD §4.1 ConsentAuditModule,
 *   §7.2 consent_record / audit_event tables, IR-04, NFR-32, VAL-10).
 *
 * Tests MUST FAIL until the following are implemented:
 *   1. Interface ConsentAuditAdapter exported from @/lib/adapters/ConsentAuditAdapter
 *      together with types AuditEvent and ConsentRecord.
 *   2. Class MockConsentAuditAdapter exported from
 *      @/lib/adapters/mocks/MockConsentAuditAdapter implementing ConsentAuditAdapter.
 */

import {
  type ConsentAuditAdapter,
  type RecordConsentEventInput,
  type RecordAuditEventInput,
  type AuditEvent,
  type ConsentRecord,
  type AuditTrailQuery,
} from "@/lib/adapters/ConsentAuditAdapter";
import { MockConsentAuditAdapter } from "@/lib/adapters/mocks/MockConsentAuditAdapter";

// ── Interface compliance ───────────────────────────────────────────────────────

describe("ConsentAuditAdapter – interface compliance", () => {
  it("MockConsentAuditAdapter implements ConsentAuditAdapter", () => {
    const adapter: ConsentAuditAdapter = new MockConsentAuditAdapter();
    expect(adapter).toBeDefined();
  });

  it("exposes recordConsentEvent as a function", () => {
    const adapter: ConsentAuditAdapter = new MockConsentAuditAdapter();
    expect(typeof adapter.recordConsentEvent).toBe("function");
  });

  it("exposes recordAuditEvent as a function", () => {
    const adapter: ConsentAuditAdapter = new MockConsentAuditAdapter();
    expect(typeof adapter.recordAuditEvent).toBe("function");
  });

  it("exposes queryAuditTrail as a function", () => {
    const adapter: ConsentAuditAdapter = new MockConsentAuditAdapter();
    expect(typeof adapter.queryAuditTrail).toBe("function");
  });
});

// ── recordConsentEvent ────────────────────────────────────────────────────────

describe("MockConsentAuditAdapter.recordConsentEvent – ConsentRecord shape", () => {
  const CONSENT_INPUT: RecordConsentEventInput = {
    sessionId: "sess_abc123",
    customerId: "cust_1001",
    purposeCode: "MARKETING",
    granted: false,
    sourceChannel: "WEB",
  };

  it("returns a ConsentRecord", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record).toBeDefined();
  });

  it("ConsentRecord has a string consentRecordId", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(typeof record.consentRecordId).toBe("string");
    expect(record.consentRecordId.length).toBeGreaterThan(0);
  });

  it("ConsentRecord sessionId matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record.sessionId).toBe(CONSENT_INPUT.sessionId);
  });

  it("ConsentRecord customerId matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record.customerId).toBe(CONSENT_INPUT.customerId);
  });

  it("ConsentRecord purposeCode matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record.purposeCode).toBe(CONSENT_INPUT.purposeCode);
  });

  it("ConsentRecord granted matches input value", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record.granted).toBe(false);
  });

  it("ConsentRecord sourceChannel matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(record.sourceChannel).toBe("WEB");
  });

  it("ConsentRecord has a recordedAt ISO timestamp string", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent(CONSENT_INPUT);
    expect(typeof record.recordedAt).toBe("string");
    expect(() => new Date(record.recordedAt)).not.toThrow();
    expect(new Date(record.recordedAt).getTime()).not.toBeNaN();
  });

  it("records PERSONALIZATION purpose with granted=true", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent({
      ...CONSENT_INPUT,
      purposeCode: "PERSONALIZATION",
      granted: true,
    });
    expect(record.purposeCode).toBe("PERSONALIZATION");
    expect(record.granted).toBe(true);
  });
});

// ── recordAuditEvent ──────────────────────────────────────────────────────────

describe("MockConsentAuditAdapter.recordAuditEvent – AuditEvent shape", () => {
  const AUDIT_INPUT: RecordAuditEventInput = {
    sessionId: "sess_abc123",
    orderId: "ord_3001",
    eventType: "PAYMENT_INITIATED",
    eventCategory: "PAYMENT",
    actorType: "CUSTOMER",
    actorId: "cust_1001",
    payloadJson: { cartId: "cart_8f3a", amount: 18999.0 },
  };

  it("returns an AuditEvent", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event).toBeDefined();
  });

  it("AuditEvent has a string auditEventId", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(typeof event.auditEventId).toBe("string");
    expect(event.auditEventId.length).toBeGreaterThan(0);
  });

  it("AuditEvent sessionId matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.sessionId).toBe(AUDIT_INPUT.sessionId);
  });

  it("AuditEvent orderId matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.orderId).toBe(AUDIT_INPUT.orderId);
  });

  it("AuditEvent eventType matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.eventType).toBe("PAYMENT_INITIATED");
  });

  it("AuditEvent eventCategory matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.eventCategory).toBe("PAYMENT");
  });

  it("AuditEvent actorType matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.actorType).toBe("CUSTOMER");
  });

  it("AuditEvent actorId matches input", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(event.actorId).toBe(AUDIT_INPUT.actorId);
  });

  it("AuditEvent payloadJson is an object", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(typeof event.payloadJson).toBe("object");
    expect(event.payloadJson).not.toBeNull();
  });

  it("AuditEvent has an occurredAt ISO timestamp string", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent(AUDIT_INPUT);
    expect(typeof event.occurredAt).toBe("string");
    expect(() => new Date(event.occurredAt)).not.toThrow();
    expect(new Date(event.occurredAt).getTime()).not.toBeNaN();
  });

  it("AuditEvent with null sessionId is accepted (system actor)", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent({
      ...AUDIT_INPUT,
      sessionId: null,
      actorType: "SYSTEM",
      actorId: "activation-service",
    });
    expect(event).toBeDefined();
    expect(event.actorType).toBe("SYSTEM");
    expect(event.sessionId).toBeNull();
  });

  it("AuditEvent with null orderId is accepted (non-order event)", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent({
      ...AUDIT_INPUT,
      orderId: null,
      eventType: "SESSION_CREATED",
      eventCategory: "IDENTITY",
    });
    expect(event).toBeDefined();
    expect(event.orderId).toBeNull();
  });
});

// ── AuditEvent matches schema-defined shape (LLD §7.2 audit_event) ────────────

describe("AuditEvent matches schema-defined shape (LLD §7.2 audit_event table)", () => {
  it("has all required schema columns as properties", async () => {
    const adapter = new MockConsentAuditAdapter();
    const event = await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: null,
      eventType: "VERIFICATION_SUBMITTED",
      eventCategory: "VERIFICATION",
      actorType: "CUSTOMER",
      actorId: "cust_1001",
      payloadJson: {},
    });
    // Maps to audit_event columns: audit_event_id, session_id, order_id,
    // event_type, event_category, actor_type, actor_id, payload_json, occurred_at
    expect(event).toHaveProperty("auditEventId");
    expect(event).toHaveProperty("sessionId");
    expect(event).toHaveProperty("orderId");
    expect(event).toHaveProperty("eventType");
    expect(event).toHaveProperty("eventCategory");
    expect(event).toHaveProperty("actorType");
    expect(event).toHaveProperty("actorId");
    expect(event).toHaveProperty("payloadJson");
    expect(event).toHaveProperty("occurredAt");
  });
});

// ── ConsentRecord matches schema-defined shape (LLD §7.2 consent_record) ─────

describe("ConsentRecord matches schema-defined shape (LLD §7.2 consent_record table)", () => {
  it("has all required schema columns as properties", async () => {
    const adapter = new MockConsentAuditAdapter();
    const record = await adapter.recordConsentEvent({
      sessionId: "sess_abc123",
      customerId: "cust_1001",
      purposeCode: "MARKETING",
      granted: true,
      sourceChannel: "WEB",
    });
    // Maps to consent_record columns: consent_record_id, session_id, customer_id,
    // purpose_code, granted, source_channel, recorded_at
    expect(record).toHaveProperty("consentRecordId");
    expect(record).toHaveProperty("sessionId");
    expect(record).toHaveProperty("customerId");
    expect(record).toHaveProperty("purposeCode");
    expect(record).toHaveProperty("granted");
    expect(record).toHaveProperty("sourceChannel");
    expect(record).toHaveProperty("recordedAt");
  });
});

// ── queryAuditTrail ───────────────────────────────────────────────────────────

describe("MockConsentAuditAdapter.queryAuditTrail", () => {
  it("returns an array of AuditEvents after recording some events", async () => {
    const adapter = new MockConsentAuditAdapter();
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: "ord_3001",
      eventType: "ORDER_CREATED",
      eventCategory: "ORDER",
      actorType: "CUSTOMER",
      actorId: "cust_1001",
      payloadJson: {},
    });
    const trail = await adapter.queryAuditTrail({ orderId: "ord_3001" });
    expect(Array.isArray(trail)).toBe(true);
    expect(trail.length).toBeGreaterThan(0);
  });

  it("filters by orderId and only returns matching events", async () => {
    const adapter = new MockConsentAuditAdapter();
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: "ord_3001",
      eventType: "ORDER_CREATED",
      eventCategory: "ORDER",
      actorType: "CUSTOMER",
      actorId: "cust_1001",
      payloadJson: {},
    });
    await adapter.recordAuditEvent({
      sessionId: "sess_xyz999",
      orderId: "ord_9999",
      eventType: "PAYMENT_INITIATED",
      eventCategory: "PAYMENT",
      actorType: "CUSTOMER",
      actorId: "cust_2002",
      payloadJson: {},
    });
    const trail = await adapter.queryAuditTrail({ orderId: "ord_3001" });
    for (const event of trail) {
      expect(event.orderId).toBe("ord_3001");
    }
  });

  it("filters by sessionId and only returns matching events", async () => {
    const adapter = new MockConsentAuditAdapter();
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: null,
      eventType: "SESSION_CREATED",
      eventCategory: "IDENTITY",
      actorType: "CUSTOMER",
      actorId: "cust_1001",
      payloadJson: {},
    });
    const trail = await adapter.queryAuditTrail({ sessionId: "sess_abc123" });
    for (const event of trail) {
      expect(event.sessionId).toBe("sess_abc123");
    }
  });

  it("returns empty array when no events match the query", async () => {
    const adapter = new MockConsentAuditAdapter();
    const trail = await adapter.queryAuditTrail({ orderId: "ord_NONEXISTENT" });
    expect(Array.isArray(trail)).toBe(true);
    expect(trail.length).toBe(0);
  });

  it("each returned AuditEvent has all required fields", async () => {
    const adapter = new MockConsentAuditAdapter();
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: "ord_3001",
      eventType: "ACTIVATION_COMPLETED",
      eventCategory: "ACTIVATION",
      actorType: "SYSTEM",
      actorId: "activation-service",
      payloadJson: { esimReference: "esim_ref_7001" },
    });
    const trail = await adapter.queryAuditTrail({ orderId: "ord_3001" });
    for (const event of trail) {
      expect(event).toHaveProperty("auditEventId");
      expect(event).toHaveProperty("eventType");
      expect(event).toHaveProperty("eventCategory");
      expect(event).toHaveProperty("actorType");
      expect(event).toHaveProperty("occurredAt");
    }
  });

  it("events are returned in ascending chronological order by occurredAt", async () => {
    const adapter = new MockConsentAuditAdapter();
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: "ord_3001",
      eventType: "ORDER_CREATED",
      eventCategory: "ORDER",
      actorType: "CUSTOMER",
      actorId: "cust_1001",
      payloadJson: {},
    });
    await adapter.recordAuditEvent({
      sessionId: "sess_abc123",
      orderId: "ord_3001",
      eventType: "PAYMENT_CONFIRMED",
      eventCategory: "PAYMENT",
      actorType: "SYSTEM",
      actorId: "payment-service",
      payloadJson: {},
    });
    const trail = await adapter.queryAuditTrail({ orderId: "ord_3001" });
    if (trail.length >= 2) {
      for (let i = 1; i < trail.length; i++) {
        const prev = new Date(trail[i - 1].occurredAt).getTime();
        const curr = new Date(trail[i].occurredAt).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    }
  });
});

// ── Idempotency / isolation ───────────────────────────────────────────────────

describe("MockConsentAuditAdapter – instance isolation", () => {
  it("two separate instances do not share recorded events", async () => {
    const adapter1 = new MockConsentAuditAdapter();
    const adapter2 = new MockConsentAuditAdapter();
    await adapter1.recordAuditEvent({
      sessionId: "sess_A",
      orderId: "ord_A",
      eventType: "ORDER_CREATED",
      eventCategory: "ORDER",
      actorType: "CUSTOMER",
      actorId: "cust_A",
      payloadJson: {},
    });
    const trail = await adapter2.queryAuditTrail({ orderId: "ord_A" });
    expect(trail.length).toBe(0);
  });
});
