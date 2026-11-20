import { z } from 'zod';
export declare const EVENT_SCHEMA_VERSION: '1.0.0';
export declare const ConfidenceLevelSchema: z.ZodEnum<{
    inferred: "inferred";
    observed: "observed";
    unavailable: "unavailable";
}>;
export declare const EventSeveritySchema: z.ZodEnum<{
    critical: "critical";
    high: "high";
    info: "info";
    low: "low";
    medium: "medium";
}>;
export declare const EventCategorySchema: z.ZodEnum<{
    ai_session: "ai_session";
    command_execution: "command_execution";
    file_access: "file_access";
    network_access: "network_access";
    prompt_interaction: "prompt_interaction";
    system_notification: "system_notification";
}>;
export declare const EventSourceSchema: z.ZodObject<{
    integration: z.ZodString;
    connectorVersion: z.ZodString;
    deviceId: z.ZodString;
    sourceKind: z.ZodLiteral<"connector_hook">;
}, z.core.$strip>;
export declare const EventRedactionMetadataSchema: z.ZodObject<{
    applied: z.ZodBoolean;
    rules: z.ZodArray<z.ZodString>;
    redactedCount: z.ZodNumber;
}, z.core.$strip>;
/**
 * Canonical normalized event envelope matching Appendix D.1 & Member 2's EVENT table.
 */
export declare const NormalizedAgentEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    dedupeKey: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodString>;
    source: z.ZodObject<{
        integration: z.ZodString;
        connectorVersion: z.ZodString;
        deviceId: z.ZodString;
        sourceKind: z.ZodLiteral<"connector_hook">;
    }, z.core.$strip>;
    eventType: z.ZodString;
    category: z.ZodEnum<{
        ai_session: "ai_session";
        command_execution: "command_execution";
        file_access: "file_access";
        network_access: "network_access";
        prompt_interaction: "prompt_interaction";
        system_notification: "system_notification";
    }>;
    occurredAt: z.ZodString;
    confidence: z.ZodEnum<{
        inferred: "inferred";
        observed: "observed";
        unavailable: "unavailable";
    }>;
    severity: z.ZodEnum<{
        critical: "critical";
        high: "high";
        info: "info";
        low: "low";
        medium: "medium";
    }>;
    summary: z.ZodString;
    correlationId: z.ZodNullable<z.ZodString>;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    redaction: z.ZodObject<{
        applied: z.ZodBoolean;
        rules: z.ZodArray<z.ZodString>;
        redactedCount: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type NormalizedAgentEvent = z.output<typeof NormalizedAgentEventSchema>;
