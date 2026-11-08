import { createHash } from 'node:crypto';
import type { MappedClaudeCodeEvent } from '../connectors/claude-code/event-mapper.js';
import type { RedactionOutcome } from '../security/redaction.service.js';
import {
  EVENT_SCHEMA_VERSION,
  type NormalizedAgentEvent,
  NormalizedAgentEventSchema,
} from './event.schema.js';

export interface NormalizerOptions {
  deviceId?: string;
}

/**
 * Computes a deterministic SHA-256 deduplication key (`dedupeKey`) so retries or duplicate
 * hook deliveries for the same tool invocation do not create duplicate backend events.
 */
export function computeDedupeKey(event: MappedClaudeCodeEvent, deviceId: string): string {
  const fingerprintParts = [
    deviceId,
    event.connectorSlug,
    event.hookEventName,
    event.eventType,
    event.sessionId ?? 'no-session',
    // If Claude Code provides a unique tool_use_id, use it with hookEventName for exact deduplication;
    // otherwise fall back to eventId so distinct invocations without tool_use_id remain unique.
    event.toolUseId ? `toolUse:${event.toolUseId}` : `event:${event.eventId}`,
  ];

  return createHash('sha256')
    .update(fingerprintParts.join('|'), 'utf8')
    .digest('hex');
}

export class EventNormalizer {
  private readonly deviceId: string;

  constructor(options: NormalizerOptions = {}) {
    this.deviceId = options.deviceId ?? 'local-unregistered-device';
  }

  public toNormalizedAgentEvent(
    mappedEvent: MappedClaudeCodeEvent,
    redactionOutcome: RedactionOutcome<{
      summary: string;
      workingDirectory: string | null;
      metadata: Record<string, unknown>;
    }>,
  ): NormalizedAgentEvent {
    const dedupeKey = computeDedupeKey(mappedEvent, this.deviceId);

    const candidate: NormalizedAgentEvent = {
      eventId: mappedEvent.eventId,
      dedupeKey,
      schemaVersion: EVENT_SCHEMA_VERSION,
      source: {
        integration: mappedEvent.connectorSlug,
        connectorVersion: mappedEvent.connectorVersion,
        deviceId: this.deviceId,
        sourceKind: 'connector_hook',
      },
      eventType: mappedEvent.eventType,
      category: mappedEvent.category,
      occurredAt: mappedEvent.occurredAt,
      confidence: mappedEvent.confidence,
      severity: mappedEvent.severity,
      summary: redactionOutcome.data.summary,
      correlationId: mappedEvent.sessionId,
      metadata: {
        ...redactionOutcome.data.metadata,
        hookEventName: mappedEvent.hookEventName,
        toolName: mappedEvent.toolName,
        toolUseId: mappedEvent.toolUseId,
        workingDirectory: redactionOutcome.data.workingDirectory,
      },
      redaction: {
        applied: redactionOutcome.applied,
        rules: redactionOutcome.matchedRules,
        redactedCount: redactionOutcome.redactedCount,
      },
    };

    return NormalizedAgentEventSchema.parse(candidate);
  }
}
