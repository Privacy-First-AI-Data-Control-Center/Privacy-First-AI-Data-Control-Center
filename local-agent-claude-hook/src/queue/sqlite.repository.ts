import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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

export class SqliteQueueRepository {
  private readonly db: DatabaseSync;
  private isClosed = false;

  constructor(dbPath = ':memory:') {
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    this.db = new DatabaseSync(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS event_queue (
        event_id TEXT PRIMARY KEY,
        dedupe_key TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TEXT NOT NULL,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        delivered_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_event_queue_status_next_attempt
        ON event_queue (status, next_attempt_at);
    `);
  }

  public insertEvent(
    event: NormalizedAgentEvent,
    maxCapacity = 5000,
  ): EnqueueResult {
    const existing = this.db
      .prepare('SELECT event_id FROM event_queue WHERE dedupe_key = ?')
      .get(event.dedupeKey) as { event_id: string } | undefined;

    if (existing) {
      return {
        enqueued: false,
        duplicate: true,
        droppedOldest: false,
        eventId: existing.event_id,
        dedupeKey: event.dedupeKey,
      };
    }

    let droppedOldest = false;
    const pendingCountRow = this.db
      .prepare("SELECT COUNT(*) as count FROM event_queue WHERE status = 'PENDING'")
      .get() as { count: number };

    if (pendingCountRow.count >= maxCapacity) {
      this.db
        .prepare(
          `DELETE FROM event_queue
           WHERE event_id IN (
             SELECT event_id FROM event_queue
             WHERE status = 'PENDING'
             ORDER BY created_at ASC
             LIMIT 1
           )`,
        )
        .run();
      droppedOldest = true;
    }

    const now = new Date().toISOString();
    const payloadJson = JSON.stringify(event);

    this.db
      .prepare(
        `INSERT INTO event_queue (
          event_id,
          dedupe_key,
          event_type,
          severity,
          payload_json,
          status,
          retry_count,
          next_attempt_at,
          last_error,
          created_at,
          updated_at,
          delivered_at
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?, NULL, ?, ?, NULL)`,
      )
      .run(
        event.eventId,
        event.dedupeKey,
        event.eventType,
        event.severity,
        payloadJson,
        now,
        now,
        now,
      );

    return {
      enqueued: true,
      duplicate: false,
      droppedOldest,
      eventId: event.eventId,
      dedupeKey: event.dedupeKey,
    };
  }

  public fetchReadyBatch(limit = 50, nowIso = new Date().toISOString()): QueuedEventRow[] {
    const rows = this.db
      .prepare(
        `SELECT
          event_id as eventId,
          dedupe_key as dedupeKey,
          event_type as eventType,
          severity,
          payload_json as payloadJson,
          status,
          retry_count as retryCount,
          next_attempt_at as nextAttemptAt,
          last_error as lastError,
          created_at as createdAt,
          updated_at as updatedAt,
          delivered_at as deliveredAt
        FROM event_queue
        WHERE status = 'PENDING' AND next_attempt_at <= ?
        ORDER BY created_at ASC
        LIMIT ?`,
      )
      .all(nowIso, limit) as unknown as QueuedEventRow[];

    return rows;
  }

  public markDelivered(eventIds: readonly string[]): number {
    if (eventIds.length === 0) {
      return 0;
    }

    const now = new Date().toISOString();
    const placeholders = eventIds.map(() => '?').join(', ');
    const stmt = this.db.prepare(
      `UPDATE event_queue
       SET status = 'DELIVERED',
           delivered_at = ?,
           updated_at = ?,
           last_error = NULL
       WHERE event_id IN (${placeholders})`,
    );

    const result = stmt.run(now, now, ...eventIds);
    return Number(result.changes);
  }

  public markRetryOrFailed(params: {
    eventId: string;
    errorMessage: string;
    maxRetries?: number;
    baseDelayMs?: number;
  }): { status: QueueItemStatus; retryCount: number; nextAttemptAt: string } {
    const maxRetries = params.maxRetries ?? 5;
    const baseDelayMs = params.baseDelayMs ?? 2000;

    const row = this.db
      .prepare('SELECT retry_count FROM event_queue WHERE event_id = ?')
      .get(params.eventId) as { retry_count: number } | undefined;

    const nextRetryCount = (row?.retry_count ?? 0) + 1;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    if (nextRetryCount > maxRetries) {
      this.db
        .prepare(
          `UPDATE event_queue
           SET status = 'FAILED',
               retry_count = ?,
               last_error = ?,
               updated_at = ?
           WHERE event_id = ?`,
        )
        .run(nextRetryCount, params.errorMessage, nowIso, params.eventId);

      return {
        status: 'FAILED',
        retryCount: nextRetryCount,
        nextAttemptAt: nowIso,
      };
    }

    const backoffMs = Math.min(baseDelayMs * 2 ** (nextRetryCount - 1), 300_000);
    const nextAttemptIso = new Date(nowMs + backoffMs).toISOString();

    this.db
      .prepare(
        `UPDATE event_queue
         SET status = 'PENDING',
             retry_count = ?,
             next_attempt_at = ?,
             last_error = ?,
             updated_at = ?
         WHERE event_id = ?`,
      )
      .run(
        nextRetryCount,
        nextAttemptIso,
        params.errorMessage,
        nowIso,
        params.eventId,
      );

    return {
      status: 'PENDING',
      retryCount: nextRetryCount,
      nextAttemptAt: nextAttemptIso,
    };
  }

  public getEventById(eventId: string): QueuedEventRow | null {
    const row = this.db
      .prepare(
        `SELECT
          event_id as eventId,
          dedupe_key as dedupeKey,
          event_type as eventType,
          severity,
          payload_json as payloadJson,
          status,
          retry_count as retryCount,
          next_attempt_at as nextAttemptAt,
          last_error as lastError,
          created_at as createdAt,
          updated_at as updatedAt,
          delivered_at as deliveredAt
        FROM event_queue
        WHERE event_id = ?`,
      )
      .get(eventId) as unknown as QueuedEventRow | undefined;

    return row ?? null;
  }

  public getStats(): QueueStats {
    const rows = this.db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM event_queue
         GROUP BY status`,
      )
      .all() as Array<{ status: QueueItemStatus; count: number }>;

    let pendingCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      if (row.status === 'PENDING') pendingCount = Number(row.count);
      if (row.status === 'DELIVERED') deliveredCount = Number(row.count);
      if (row.status === 'FAILED') failedCount = Number(row.count);
    }

    return {
      pendingCount,
      deliveredCount,
      failedCount,
      totalCount: pendingCount + deliveredCount + failedCount,
    };
  }

  public listRecentEvents(limit = 50): QueuedEventRow[] {
    const rows = this.db
      .prepare(
        `SELECT
          event_id as eventId,
          dedupe_key as dedupeKey,
          event_type as eventType,
          severity,
          payload_json as payloadJson,
          status,
          retry_count as retryCount,
          next_attempt_at as nextAttemptAt,
          last_error as lastError,
          created_at as createdAt,
          updated_at as updatedAt,
          delivered_at as deliveredAt
        FROM event_queue
        ORDER BY created_at DESC
        LIMIT ?`,
      )
      .all(limit) as unknown as QueuedEventRow[];

    return rows;
  }

  public close(): void {
    if (!this.isClosed) {
      this.db.close();
      this.isClosed = true;
    }
  }
}
