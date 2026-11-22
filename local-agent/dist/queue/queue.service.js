import { SqliteQueueRepository, } from './sqlite.repository.js';
export class QueueService {
    repository;
    maxCapacity;
    maxRetries;
    baseDelayMs;
    constructor(options = {}) {
        this.repository =
            options.repository ?? new SqliteQueueRepository(options.dbPath ?? ':memory:');
        this.maxCapacity = options.maxCapacity ?? 5000;
        this.maxRetries = options.maxRetries ?? 5;
        this.baseDelayMs = options.baseDelayMs ?? 2000;
    }
    enqueue(event) {
        return this.repository.insertEvent(event, this.maxCapacity);
    }
    getReadyEvents(limit = 50, nowIso) {
        const rows = this.repository.fetchReadyBatch(limit, nowIso);
        return rows.map((row) => ({
            row,
            event: JSON.parse(row.payloadJson),
        }));
    }
    acknowledgeDelivered(eventIds) {
        return this.repository.markDelivered(eventIds);
    }
    recordSubmissionFailure(eventId, errorMessage) {
        return this.repository.markRetryOrFailed({
            eventId,
            errorMessage,
            maxRetries: this.maxRetries,
            baseDelayMs: this.baseDelayMs,
        });
    }
    findById(eventId) {
        return this.repository.getEventById(eventId);
    }
    getStats() {
        return this.repository.getStats();
    }
    listRecent(limit = 50) {
        return this.repository.listRecentEvents(limit).map((row) => ({
            status: row.status,
            retryCount: row.retryCount,
            createdAt: row.createdAt,
            deliveredAt: row.deliveredAt,
            event: JSON.parse(row.payloadJson),
        }));
    }
    close() {
        this.repository.close();
    }
}
//# sourceMappingURL=queue.service.js.map