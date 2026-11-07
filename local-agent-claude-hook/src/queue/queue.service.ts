import type { NormalizedAgentEvent } from '../events/event.schema.js';
import {
  type EnqueueResult,
  type QueuedEventRow,
  type QueueItemStatus,
  type QueueStats,
  SqliteQueueRepository,
} from './sqlite.repository.js';

export interface QueueServiceOptions {
  repository?: SqliteQueueRepository;
  dbPath?: string;
  maxCapacity?: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

export class QueueService {
  private readonly repository: SqliteQueueRepository;
  private readonly maxCapacity: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(options: QueueServiceOptions = {}) {
    this.repository =
      options.repository ?? new SqliteQueueRepository(options.dbPath ?? ':memory:');
    this.maxCapacity = options.maxCapacity ?? 5000;
    this.maxRetries = options.maxRetries ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 2000;
  }

  public enqueue(event: NormalizedAgentEvent): EnqueueResult {
    return this.repository.insertEvent(event, this.maxCapacity);
  }

  public getReadyEvents(limit = 50, nowIso?: string): Array<{
    row: QueuedEventRow;
    event: NormalizedAgentEvent;
  }> {
    const rows = this.repository.fetchReadyBatch(limit, nowIso);
    return rows.map((row) => ({
      row,
      event: JSON.parse(row.payloadJson) as NormalizedAgentEvent,
    }));
  }

  public acknowledgeDelivered(eventIds: readonly string[]): number {
    return this.repository.markDelivered(eventIds);
  }

  public recordSubmissionFailure(
    eventId: string,
    errorMessage: string,
  ): { status: QueueItemStatus; retryCount: number; nextAttemptAt: string } {
    return this.repository.markRetryOrFailed({
      eventId,
      errorMessage,
      maxRetries: this.maxRetries,
      baseDelayMs: this.baseDelayMs,
    });
  }

  public findById(eventId: string): QueuedEventRow | null {
    return this.repository.getEventById(eventId);
  }

  public getStats(): QueueStats {
    return this.repository.getStats();
  }

  public listRecent(limit = 50): Array<{
    status: QueueItemStatus;
    retryCount: number;
    createdAt: string;
    deliveredAt: string | null;
    event: NormalizedAgentEvent;
  }> {
    return this.repository.listRecentEvents(limit).map((row) => ({
      status: row.status,
      retryCount: row.retryCount,
      createdAt: row.createdAt,
      deliveredAt: row.deliveredAt,
      event: JSON.parse(row.payloadJson) as NormalizedAgentEvent,
    }));
  }

  public close(): void {
    this.repository.close();
  }
}
