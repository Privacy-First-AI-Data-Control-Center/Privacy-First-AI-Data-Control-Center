import { z } from 'zod';
import { EventProcessor } from '../../events/event-processor.js';
import type { PolicyEvaluationResult } from '../../policy/policy-engine.service.js';
import { ClaudeCodeConnectorService } from './connector.service.js';
import type { ConfidenceLevel, ConnectorSlug, EventSeverity, NormalizedEventCategory, NormalizedEventType } from './event-mapper.js';
export declare const CLAUDE_CODE_HOOK_EVENTS: readonly ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Notification', 'Stop', 'SubagentStop', 'PreCompact', 'SessionEnd'];
export type ClaudeCodeHookEventName = (typeof CLAUDE_CODE_HOOK_EVENTS)[number];
/**
 * Zod schema validating and allowlisting fields from Claude Code native HTTP hook payloads.
 * Unknown top-level fields are stripped so arbitrary unvalidated properties are not persisted.
 */
export declare const ClaudeCodeHookPayloadSchema: z.ZodObject<{
    hook_event_name: z.ZodEnum<{
        Notification: "Notification";
        PostToolUse: "PostToolUse";
        PostToolUseFailure: "PostToolUseFailure";
        PreCompact: "PreCompact";
        PreToolUse: "PreToolUse";
        SessionEnd: "SessionEnd";
        SessionStart: "SessionStart";
        Stop: "Stop";
        SubagentStop: "SubagentStop";
        UserPromptSubmit: "UserPromptSubmit";
    }>;
    session_id: z.ZodOptional<z.ZodString>;
    transcript_path: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    permission_mode: z.ZodOptional<z.ZodString>;
    tool_name: z.ZodOptional<z.ZodString>;
    tool_use_id: z.ZodOptional<z.ZodString>;
    tool_input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tool_response: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
export declare class ClaudeCodeHookHandler {
    private readonly connectorService;
    private readonly eventProcessor;
    constructor(options?: ClaudeCodeHookHandlerOptions);
    handleHookPayload(payload: ClaudeCodeHookPayload, connectorSlug?: ConnectorSlug, policyEvaluation?: PolicyEvaluationResult): Promise<HookReceiptResult>;
}
