import type { NormalizedAgentEvent } from '../events/event.schema.js';
import { type EnqueueResult, type QueuedEventRow, type QueueItemStatus, type QueueStats, SqliteQueueRepository } from './sqlite.repository.js';
export interface QueueServiceOptions {
    repository?: SqliteQueueRepository;
    dbPath?: string;
    maxCapacity?: number;
    maxRetries?: number;
    baseDelayMs?: number;
}
export declare class QueueService {
    private readonly repository;
    private readonly maxCapacity;
    private readonly maxRetries;
    private readonly baseDelayMs;
    constructor(options?: QueueServiceOptions);
    enqueue(event: NormalizedAgentEvent): EnqueueResult;
    getReadyEvents(limit?: number, nowIso?: string): Array<{
        row: QueuedEventRow;
        event: NormalizedAgentEvent;
    }>;
    acknowledgeDelivered(eventIds: readonly string[]): number;
    recordSubmissionFailure(eventId: string, errorMessage: string): {
        status: QueueItemStatus;
        retryCount: number;
        nextAttemptAt: string;
    };
    findById(eventId: string): QueuedEventRow | null;
    getStats(): QueueStats;
    listRecent(limit?: number): Array<{
        status: QueueItemStatus;
        retryCount: number;
        createdAt: string;
        deliveredAt: string | null;
        event: NormalizedAgentEvent;
    }>;
    close(): void;
}
