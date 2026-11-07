import { z } from 'zod';

export const EVENT_SCHEMA_VERSION = '1.0.0' as const;

export const ConfidenceLevelSchema = z.enum([
  'observed',
  'inferred',
  'unavailable',
]);

export const EventSeveritySchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
]);

export const EventCategorySchema = z.enum([
  'ai_session',
  'command_execution',
  'file_access',
  'network_access',
  'prompt_interaction',
  'system_notification',
]);

export const EventSourceSchema = z.object({
  integration: z.string().min(1),
  connectorVersion: z.string().min(1),
  deviceId: z.string().min(1),
  sourceKind: z.literal('connector_hook'),
});

export const EventRedactionMetadataSchema = z.object({
  applied: z.boolean(),
  rules: z.array(z.string()),
  redactedCount: z.number().int().nonnegative(),
});

/**
 * Canonical normalized event envelope matching Appendix D.1 & Member 2's EVENT table.
 */
export const NormalizedAgentEventSchema = z.object({
  eventId: z.string().uuid(),
  dedupeKey: z.string().min(16).max(128),
  schemaVersion: z.string().default(EVENT_SCHEMA_VERSION),
  source: EventSourceSchema,
  eventType: z.string().min(1),
  category: EventCategorySchema,
  occurredAt: z.string().datetime(),
  confidence: ConfidenceLevelSchema,
  severity: EventSeveritySchema,
  summary: z.string().min(1).max(1024),
  correlationId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  redaction: EventRedactionMetadataSchema,
});

export type NormalizedAgentEvent = z.output<typeof NormalizedAgentEventSchema>;
