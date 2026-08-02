import type {
  ConsentAuditAdapter,
  RecordConsentEventInput,
  RecordAuditEventInput,
  AuditEvent,
  ConsentRecord,
  AuditTrailQuery,
} from "@/lib/adapters/ConsentAuditAdapter";

let consentCounter = 0;
let auditCounter = 0;

/**
 * MockConsentAuditAdapter — in-memory consent and audit adapter for demo and testing.
 *
 * Each instance maintains its own isolated event store (IR-04, VAL-10).
 * AuditEvent objects match the audit_event table schema (LLD §7.2).
 * ConsentRecord objects match the consent_record table schema (LLD §7.2).
 * queryAuditTrail returns events in ascending chronological order.
 */
export class MockConsentAuditAdapter implements ConsentAuditAdapter {
  private readonly auditEvents: AuditEvent[] = [];
  private readonly consentRecords: ConsentRecord[] = [];

  async recordConsentEvent(input: RecordConsentEventInput): Promise<ConsentRecord> {
    consentCounter += 1;
    const record: ConsentRecord = {
      consentRecordId: `cr_${String(consentCounter).padStart(4, "0")}`,
      sessionId: input.sessionId,
      customerId: input.customerId ?? null,
      purposeCode: input.purposeCode,
      granted: input.granted,
      sourceChannel: input.sourceChannel,
      recordedAt: new Date().toISOString(),
    };
    this.consentRecords.push(record);
    return record;
  }

  async recordAuditEvent(input: RecordAuditEventInput): Promise<AuditEvent> {
    auditCounter += 1;
    const event: AuditEvent = {
      auditEventId: `ae_${String(auditCounter).padStart(4, "0")}`,
      sessionId: input.sessionId,
      orderId: input.orderId,
      eventType: input.eventType,
      eventCategory: input.eventCategory,
      actorType: input.actorType,
      actorId: input.actorId,
      payloadJson: input.payloadJson,
      occurredAt: new Date().toISOString(),
    };
    this.auditEvents.push(event);
    return event;
  }

  async queryAuditTrail(query: AuditTrailQuery): Promise<AuditEvent[]> {
    const matched = this.auditEvents.filter((e) => {
      if (query.orderId !== undefined && e.orderId !== query.orderId) return false;
      if (query.sessionId !== undefined && e.sessionId !== query.sessionId) return false;
      return true;
    });
    return [...matched].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
  }
}
