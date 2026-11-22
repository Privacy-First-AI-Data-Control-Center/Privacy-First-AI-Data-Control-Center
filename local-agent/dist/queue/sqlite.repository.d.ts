import type { NormalizedAgentEvent } from '../events/event.schema.js';
export type QueueItemStatus = 'PENDING' | 'DELIVERED' | 'FAILED';
export interface QueuedEventRow {
    eventId: string;
    dedupeKey: string;
    eventType: string;
    severity: string;
    payloadJson: string;
    status: QueueItemStatus;
    retryCount: number;
    nextAttemptAt: string;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
    deliveredAt: string | null;
}
export interface EnqueueResult {
    enqueued: boolean;
    duplicate: boolean;
    droppedOldest: boolean;
    eventId: string;
    dedupeKey: string;
}
export interface QueueStats {
    pendingCount: number;
    deliveredCount: number;
    failedCount: number;
    totalCount: number;
}
export declare class SqliteQueueRepository {
    private readonly db;
    private isClosed;
    constructor(dbPath?: string);
    private initializeSchema;
    insertEvent(event: NormalizedAgentEvent, maxCapacity?: number): EnqueueResult;
    fetchReadyBatch(limit?: number, nowIso?: string): QueuedEventRow[];
    markDelivered(eventIds: readonly string[]): number;
    markRetryOrFailed(params: {
        eventId: string;
        errorMessage: string;
        maxRetries?: number;
        baseDelayMs?: number;
    }): {
        status: QueueItemStatus;
        retryCount: number;
        nextAttemptAt: string;
    };
    getEventById(eventId: string): QueuedEventRow | null;
    getStats(): QueueStats;
    listRecentEvents(limit?: number): QueuedEventRow[];
    close(): void;
}
