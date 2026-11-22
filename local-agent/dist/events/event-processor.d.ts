import type { MappedClaudeCodeEvent } from '../connectors/claude-code/event-mapper.js';
import type { EnqueueResult } from '../queue/sqlite.repository.js';
import { QueueService } from '../queue/queue.service.js';
import { RedactionService } from '../security/redaction.service.js';
import { EventNormalizer } from './event-normalizer.js';
import type { NormalizedAgentEvent } from './event.schema.js';
export interface ProcessedEventResult {
    normalizedEvent: NormalizedAgentEvent;
    queueResult: EnqueueResult;
}
export interface EventProcessorOptions {
    redactionService?: RedactionService;
    eventNormalizer?: EventNormalizer;
    queueService?: QueueService;
}
/**
 * Orchestrates the Stage 4 event pipeline:
 * Mapped Event -> Sensitive-Data Redaction -> Canonical Normalization -> SQLite Persistent Queue
 */
export declare class EventProcessor {
    private readonly redactionService;
    private readonly eventNormalizer;
    private readonly queueService;
    constructor(options?: EventProcessorOptions);
    processMappedEvent(mappedEvent: MappedClaudeCodeEvent): ProcessedEventResult;
    getQueueService(): QueueService;
}
