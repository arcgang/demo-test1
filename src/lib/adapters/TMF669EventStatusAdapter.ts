/**
 * TMF669 Event and Status Management adapter.
 *
 * Represents the boundary toward the TM Forum TMF669 Event Management API —
 * used to publish domain status events, poll milestone histories, and ingest
 * provider callbacks (e.g. mobile money, activation updates).
 * Orchestration services depend on this interface; swap the mock for a real
 * event bus or webhook receiver without changing any service logic (IR-04).
 */

export interface StatusEvent {
  correlationId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface StatusMilestone {
  milestoneType: string;
  entityId: string;
  status: string;
  timestamp: string;
  providerReference?: string;
  message?: string;
}

export interface CallbackPayload {
  correlationId: string;
  providerReference: string;
  entityId: string;
  status: string;
  occurredAt: string;
}

/** TMF669 Event and Status adapter interface. */
export interface EventStatusAdapter {
  /** Publish a domain status event to the event boundary. */
  publishStatusEvent(event: StatusEvent): Promise<void>;

  /** Poll accumulated status milestones for an entity. */
  pollStatusMilestones(entityId: string): Promise<StatusMilestone[]>;

  /** Ingest and record an inbound provider callback. */
  ingestCallback(callback: CallbackPayload): Promise<void>;
}

/** Deterministic mock for TMF669 EventStatusAdapter. */
export class MockTMF669EventStatusAdapter implements EventStatusAdapter {
  private readonly milestones = new Map<string, StatusMilestone[]>();

  private append(entityId: string, milestone: StatusMilestone): void {
    const existing = this.milestones.get(entityId) ?? [];
    existing.push(milestone);
    this.milestones.set(entityId, existing);
  }

  async publishStatusEvent(event: StatusEvent): Promise<void> {
    this.append(event.entityId, {
      milestoneType: event.eventType,
      entityId: event.entityId,
      status: "PUBLISHED",
      timestamp: new Date().toISOString(),
      message: JSON.stringify(event.payload),
    });
  }

  async pollStatusMilestones(entityId: string): Promise<StatusMilestone[]> {
    return this.milestones.get(entityId) ?? [];
  }

  async ingestCallback(callback: CallbackPayload): Promise<void> {
    this.append(callback.entityId, {
      milestoneType: "CALLBACK",
      entityId: callback.entityId,
      status: callback.status,
      timestamp: callback.occurredAt,
      providerReference: callback.providerReference,
    });
  }
}
