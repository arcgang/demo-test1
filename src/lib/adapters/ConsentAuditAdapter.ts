/**
 * ConsentAuditAdapter — integration boundary for the Consent and Audit Record Sink.
 *
 * Business capability: persist purpose-specific customer consent records and
 * immutable audit event entries covering sensitive data access, payment
 * outcomes, verification transitions, and activation changes.
 *
 * Compliance domain: POPIA consent management (purpose, timestamp, source
 * channel per VAL-10), PCI-DSS payment audit trail, RICA verification
 * accountability, and regulatory audit readiness (LLD §4.1
 * ConsentAuditModule, §7.2 consent_record / audit_event tables,
 * IR-04, NFR-32).
 *
 * All implementations must be substitutable without changing domain service
 * logic (IR-04).
 */

/** Input to record a customer's consent decision for a specific purpose. */
export interface RecordConsentEventInput {
  sessionId: string;
  customerId: string | null;
  /** MARKETING | PERSONALIZATION | DATA_SHARING */
  purposeCode: string;
  granted: boolean;
  /** WEB | APP | STORE */
  sourceChannel: string;
}

/**
 * Persisted consent record — maps to the consent_record table
 * (LLD §7.2).
 */
export interface ConsentRecord {
  consentRecordId: string;
  sessionId: string;
  customerId: string | null;
  purposeCode: string;
  granted: boolean;
  sourceChannel: string;
  /** ISO 8601 UTC timestamp of when consent was recorded. */
  recordedAt: string;
}

/** Input to record a business or security-relevant audit event. */
export interface RecordAuditEventInput {
  sessionId: string | null;
  orderId: string | null;
  eventType: string;
  eventCategory: string;
  /** CUSTOMER | SYSTEM | AGENT */
  actorType: string;
  actorId: string;
  payloadJson: Record<string, unknown>;
}

/**
 * Persisted audit event — maps to the audit_event table (LLD §7.2).
 */
export interface AuditEvent {
  auditEventId: string;
  sessionId: string | null;
  orderId: string | null;
  eventType: string;
  eventCategory: string;
  actorType: string;
  actorId: string;
  payloadJson: Record<string, unknown>;
  /** ISO 8601 UTC timestamp of when the event occurred. */
  occurredAt: string;
}

/** Filter criteria for querying the audit trail. */
export interface AuditTrailQuery {
  orderId?: string;
  sessionId?: string;
}

/**
 * ConsentAuditAdapter — contract for consent capture and audit log interactions.
 *
 * Used by ConsentAuditModule to write consent records and audit events at
 * every regulated transition: consent capture, payment outcome, verification
 * status change, and activation change.
 */
export interface ConsentAuditAdapter {
  /** Persist a consent decision for a specific purpose code and channel. */
  recordConsentEvent(input: RecordConsentEventInput): Promise<ConsentRecord>;

  /** Persist an immutable audit event for a business or security action. */
  recordAuditEvent(input: RecordAuditEventInput): Promise<AuditEvent>;

  /**
   * Query the audit trail filtered by order or session.
   * Results are returned in ascending chronological order.
   */
  queryAuditTrail(query: AuditTrailQuery): Promise<AuditEvent[]>;
}
