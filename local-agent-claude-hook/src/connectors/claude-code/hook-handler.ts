import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { EventProcessor } from '../../events/event-processor.js';
import { ClaudeCodeConnectorService } from './connector.service.js';
import type {
  ConfidenceLevel,
  ConnectorSlug,
  EventSeverity,
  NormalizedEventCategory,
  NormalizedEventType,
} from './event-mapper.js';

export const CLAUDE_CODE_HOOK_EVENTS = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'Stop',
  'SubagentStop',
  'PreCompact',
  'SessionEnd',
] as const;

export type ClaudeCodeHookEventName = (typeof CLAUDE_CODE_HOOK_EVENTS)[number];

/**
 * Zod schema validating and allowlisting fields from Claude Code native HTTP hook payloads.
 * Unknown top-level fields are stripped so arbitrary unvalidated properties are not persisted.
 */
export const ClaudeCodeHookPayloadSchema = z
  .object({
    hook_event_name: z.enum(CLAUDE_CODE_HOOK_EVENTS),
    session_id: z.string().trim().min(1).max(256).optional(),
    transcript_path: z.string().trim().max(2048).optional(),
    cwd: z.string().trim().max(2048).optional(),
    permission_mode: z.string().trim().max(128).optional(),
    tool_name: z.string().trim().min(1).max(256).optional(),
    tool_use_id: z.string().trim().max(256).optional(),
    tool_input: z.record(z.string(), z.unknown()).optional(),
    tool_response: z.unknown().optional(),
    error: z.string().trim().max(4096).optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const toolEvents: ClaudeCodeHookEventName[] = [
      'PreToolUse',
      'PostToolUse',
      'PostToolUseFailure',
    ];
    if (toolEvents.includes(data.hook_event_name) && !data.tool_name) {
      ctx.addIssue({
        code: 'custom',
        path: ['tool_name'],
        message: `tool_name is required when hook_event_name is ${data.hook_event_name}`,
      });
    }
  });

export type ClaudeCodeHookPayload = z.output<typeof ClaudeCodeHookPayloadSchema>;

export interface HookReceiptResult {
  status: 'accepted';
  receiptId: string;
  eventId: string;
  dedupeKey: string;
  queued: boolean;
  duplicate: boolean;
  redacted: boolean;
  connector: ConnectorSlug;
  hookEventName: ClaudeCodeHookEventName;
  eventType: NormalizedEventType;
  category: NormalizedEventCategory;
  severity: EventSeverity;
  confidence: ConfidenceLevel;
  toolName: string | null;
  sessionId: string | null;
  summary: string;
  receivedAt: string;
}

export interface ClaudeCodeHookHandlerOptions {
  connectorService?: ClaudeCodeConnectorService;
  eventProcessor?: EventProcessor;
}

export class ClaudeCodeHookHandler {
  private readonly connectorService: ClaudeCodeConnectorService;
  private readonly eventProcessor: EventProcessor;

  constructor(options: ClaudeCodeHookHandlerOptions = {}) {
    this.connectorService =
      options.connectorService ?? new ClaudeCodeConnectorService();
    this.eventProcessor = options.eventProcessor ?? new EventProcessor();
  }

  public async handleHookPayload(
    payload: ClaudeCodeHookPayload,
    connectorSlug: ConnectorSlug = 'claude-code',
  ): Promise<HookReceiptResult> {
    const receiptId = randomUUID();
    const receivedAt = new Date().toISOString();
    const mappedEvent = this.connectorService.normalizeHookPayload(payload, connectorSlug);
    const { normalizedEvent, queueResult } =
      this.eventProcessor.processMappedEvent(mappedEvent);

    return {
      status: 'accepted',
      receiptId,
      eventId: queueResult.eventId,
      dedupeKey: queueResult.dedupeKey,
      queued: queueResult.enqueued,
      duplicate: queueResult.duplicate,
      redacted: normalizedEvent.redaction.applied,
      connector: mappedEvent.connectorSlug,
      hookEventName: mappedEvent.hookEventName,
      eventType: mappedEvent.eventType,
      category: mappedEvent.category,
      severity: mappedEvent.severity,
      confidence: mappedEvent.confidence,
      toolName: mappedEvent.toolName,
      sessionId: mappedEvent.sessionId,
      summary: normalizedEvent.summary,
      receivedAt,
    };
  }
}
