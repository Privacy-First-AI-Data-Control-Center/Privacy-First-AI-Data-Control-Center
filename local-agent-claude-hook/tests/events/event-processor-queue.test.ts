import { afterEach, describe, expect, it } from 'vitest';
import { ClaudeCodeEventMapper } from '../../src/connectors/claude-code/event-mapper.js';
import { EventNormalizer } from '../../src/events/event-normalizer.js';
import { EventProcessor } from '../../src/events/event-processor.js';
import { QueueService } from '../../src/queue/queue.service.js';
import { RedactionService } from '../../src/security/redaction.service.js';

describe('Stage 4: EventProcessor & SQLite Persistent Queue', () => {
  let queueService: QueueService | null = null;

  function createPipeline(maxCapacity = 5000): {
    mapper: ClaudeCodeEventMapper;
    processor: EventProcessor;
    queue: QueueService;
  } {
    const mapper = new ClaudeCodeEventMapper('1.0.0');
    const queue = new QueueService({
      dbPath: ':memory:',
      maxCapacity,
      maxRetries: 2,
      baseDelayMs: 1000,
    });
    queueService = queue;

    const processor = new EventProcessor({
      redactionService: new RedactionService(),
      eventNormalizer: new EventNormalizer({ deviceId: 'device-test-001' }),
      queueService: queue,
    });

    return { mapper, processor, queue };
  }

  afterEach(() => {
    if (queueService) {
      queueService.close();
      queueService = null;
    }
  });

  it('redacts secrets before SQLite persistence and queues normalized events', () => {
    const { mapper, processor, queue } = createPipeline();

    const mapped = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      session_id: 'sess-500',
      cwd: '/home/shohag-rana/project',
      tool_name: 'Bash',
      tool_use_id: 'toolu_01ABC',
      tool_input: {
        command: 'export OPENAI_API_KEY=sk-proj-99999999999999999999 && npm start',
      },
    });

    const { normalizedEvent, queueResult } = processor.processMappedEvent(mapped);

    expect(queueResult.enqueued).toBe(true);
    expect(queueResult.duplicate).toBe(false);
    expect(normalizedEvent.redaction.applied).toBe(true);
    expect(normalizedEvent.redaction.rules).toContain('OPENAI_API_KEY');

    // Verify the SQLite row on disk does NOT contain the raw secret
    const storedRow = queue.findById(normalizedEvent.eventId);
    expect(storedRow).not.toBeNull();
    expect(storedRow?.status).toBe('PENDING');
    expect(storedRow?.payloadJson).not.toContain('sk-proj-99999999999999999999');
    expect(storedRow?.payloadJson).toContain('[REDACTED:OPENAI_API_KEY]');
  });

  it('prevents duplicate ingestion when the same tool_use_id + hook_event_name is received twice', () => {
    const { mapper, processor, queue } = createPipeline();

    const firstMapped = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      session_id: 'sess-501',
      tool_name: 'Read',
      tool_use_id: 'toolu_duplicate_test_01',
      tool_input: { file_path: '/workspace/README.md' },
    });

    const secondMapped = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      session_id: 'sess-501',
      tool_name: 'Read',
      tool_use_id: 'toolu_duplicate_test_01',
      tool_input: { file_path: '/workspace/README.md' },
    });

    const firstResult = processor.processMappedEvent(firstMapped);
    const secondResult = processor.processMappedEvent(secondMapped);

    expect(firstResult.queueResult.enqueued).toBe(true);
    expect(firstResult.queueResult.duplicate).toBe(false);

    expect(secondResult.queueResult.enqueued).toBe(false);
    expect(secondResult.queueResult.duplicate).toBe(true);
    expect(secondResult.queueResult.eventId).toBe(firstResult.queueResult.eventId);

    expect(queue.getStats().pendingCount).toBe(1);
  });

  it('supports queue delivery acknowledgement, exponential backoff retries, and FAILED transition', () => {
    const { mapper, processor, queue } = createPipeline();

    const event1 = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_retry_1',
        tool_input: { command: 'echo 1' },
      }),
    ).normalizedEvent;

    const event2 = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_retry_2',
        tool_input: { command: 'echo 2' },
      }),
    ).normalizedEvent;

    // Mark event1 as delivered
    const deliveredCount = queue.acknowledgeDelivered([event1.eventId]);
    expect(deliveredCount).toBe(1);

    // Fail event2 three times (maxRetries = 2 -> 3rd failure transitions to FAILED)
    const retry1 = queue.recordSubmissionFailure(event2.eventId, 'Backend 503');
    expect(retry1.status).toBe('PENDING');
    expect(retry1.retryCount).toBe(1);

    const retry2 = queue.recordSubmissionFailure(event2.eventId, 'Backend 503');
    expect(retry2.status).toBe('PENDING');
    expect(retry2.retryCount).toBe(2);

    const retry3 = queue.recordSubmissionFailure(event2.eventId, 'Backend 503');
    expect(retry3.status).toBe('FAILED');
    expect(retry3.retryCount).toBe(3);

    const stats = queue.getStats();
    expect(stats).toEqual({
      pendingCount: 0,
      deliveredCount: 1,
      failedCount: 1,
      totalCount: 2,
    });
  });

  it('enforces bounded queue capacity by dropping the oldest pending event when full', () => {
    const { mapper, processor, queue } = createPipeline(2); // Max 2 pending items

    const e1 = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_cap_1',
        tool_input: { command: 'echo 1' },
      }),
    );
    const e2 = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_cap_2',
        tool_input: { command: 'echo 2' },
      }),
    );
    const e3 = processor.processMappedEvent(
      mapper.mapHookToEvent({
        hook_event_name: 'PostToolUse',
        tool_name: 'Bash',
        tool_use_id: 'toolu_cap_3',
        tool_input: { command: 'echo 3' },
      }),
    );

    expect(e1.queueResult.droppedOldest).toBe(false);
    expect(e2.queueResult.droppedOldest).toBe(false);
    expect(e3.queueResult.droppedOldest).toBe(true);

    expect(queue.getStats().pendingCount).toBe(2);
    expect(queue.findById(e1.normalizedEvent.eventId)).toBeNull();
    expect(queue.findById(e2.normalizedEvent.eventId)).not.toBeNull();
    expect(queue.findById(e3.normalizedEvent.eventId)).not.toBeNull();
  });
});
