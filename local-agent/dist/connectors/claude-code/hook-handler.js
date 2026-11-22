import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { EventProcessor } from '../../events/event-processor.js';
import { ClaudeCodeConnectorService } from './connector.service.js';
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
];
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
    const toolEvents = [
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
export class ClaudeCodeHookHandler {
    connectorService;
    eventProcessor;
    constructor(options = {}) {
        this.connectorService =
            options.connectorService ?? new ClaudeCodeConnectorService();
        this.eventProcessor = options.eventProcessor ?? new EventProcessor();
    }
    async handleHookPayload(payload, connectorSlug = 'claude-code', policyEvaluation) {
        const receiptId = randomUUID();
        const receivedAt = new Date().toISOString();
        const mappedEvent = this.connectorService.normalizeHookPayload(payload, connectorSlug);
        if (policyEvaluation && (policyEvaluation.decision === 'BLOCK' || policyEvaluation.decision === 'WARN')) {
            mappedEvent.metadata = {
                ...mappedEvent.metadata,
                policyDecision: policyEvaluation.decision,
                policyId: policyEvaluation.policyId,
                policyVersionId: policyEvaluation.policyVersionId,
                policyName: policyEvaluation.policyName,
                ruleId: policyEvaluation.ruleId,
                policyReason: policyEvaluation.reason,
                matchedValue: policyEvaluation.matchedValue,
            };
            if (policyEvaluation.decision === 'BLOCK') {
                mappedEvent.severity = 'high';
            }
        }
        const { normalizedEvent, queueResult } = this.eventProcessor.processMappedEvent(mappedEvent);
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
//# sourceMappingURL=hook-handler.js.map