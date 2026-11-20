import type { MappedClaudeCodeEvent } from '../connectors/claude-code/event-mapper.js';
import type { RedactionOutcome } from '../security/redaction.service.js';
import { type NormalizedAgentEvent } from './event.schema.js';
export interface NormalizerOptions {
    deviceId?: string;
}
/**
 * Computes a deterministic SHA-256 deduplication key (`dedupeKey`) so retries or duplicate
 * hook deliveries for the same tool invocation do not create duplicate backend events.
 */
export declare function computeDedupeKey(event: MappedClaudeCodeEvent, deviceId: string): string;
export declare class EventNormalizer {
    private readonly deviceId;
    constructor(options?: NormalizerOptions);
    toNormalizedAgentEvent(mappedEvent: MappedClaudeCodeEvent, redactionOutcome: RedactionOutcome<{
        summary: string;
        workingDirectory: string | null;
        metadata: Record<string, unknown>;
    }>): NormalizedAgentEvent;
}
