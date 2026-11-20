import { QueueService } from '../queue/queue.service.js';
import { RedactionService } from '../security/redaction.service.js';
import { EventNormalizer } from './event-normalizer.js';
/**
 * Orchestrates the Stage 4 event pipeline:
 * Mapped Event -> Sensitive-Data Redaction -> Canonical Normalization -> SQLite Persistent Queue
 */
export class EventProcessor {
    redactionService;
    eventNormalizer;
    queueService;
    constructor(options = {}) {
        this.redactionService = options.redactionService ?? new RedactionService();
        this.eventNormalizer = options.eventNormalizer ?? new EventNormalizer();
        this.queueService = options.queueService ?? new QueueService();
    }
    processMappedEvent(mappedEvent) {
        // 1. Redact sensitive values BEFORE normalization and disk persistence (NFR-02, FR-09)
        const redactionOutcome = this.redactionService.redactObject({
            summary: mappedEvent.summary,
            workingDirectory: mappedEvent.workingDirectory,
            metadata: mappedEvent.metadata,
        });
        // 2. Normalize into canonical schema with deterministic dedupeKey
        const normalizedEvent = this.eventNormalizer.toNormalizedAgentEvent(mappedEvent, redactionOutcome);
        // 3. Persist to SQLite queue with deduplication check
        const queueResult = this.queueService.enqueue(normalizedEvent);
        return {
            normalizedEvent,
            queueResult,
        };
    }
    getQueueService() {
        return this.queueService;
    }
}
//# sourceMappingURL=event-processor.js.map