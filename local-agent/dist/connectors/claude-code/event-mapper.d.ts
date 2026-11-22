import type { ClaudeCodeHookEventName, ClaudeCodeHookPayload } from './hook-handler.js';
/**
 * AI tools whose hook payloads share the Claude Code hook shape
 * (Antigravity and Gemini CLI are translated into it by the hook bridge script).
 */
export declare const CONNECTOR_SLUGS: readonly ['claude-code', 'antigravity', 'gemini-cli', 'cursor'];
export type ConnectorSlug = (typeof CONNECTOR_SLUGS)[number];
export declare const CONNECTOR_DISPLAY_NAMES: Record<ConnectorSlug, string>;
export type ConfidenceLevel = 'observed' | 'inferred' | 'unavailable';
export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type NormalizedEventCategory = 'ai_session' | 'command_execution' | 'file_access' | 'network_access' | 'prompt_interaction' | 'system_notification';
export type NormalizedEventType = 'ai.session.started' | 'ai.session.ended' | 'ai.prompt.submitted' | 'ai.turn.stopped' | 'ai.subagent.stopped' | 'ai.context.compacting' | 'ai.notification.received' | 'tool.command.started' | 'tool.command.completed' | 'tool.command.failed' | 'file.read' | 'file.write' | 'file.edit' | 'file.search' | 'network.request' | 'tool.call.started' | 'tool.call.completed' | 'tool.call.failed';
export interface MappedClaudeCodeEvent {
    eventId: string;
    connectorSlug: ConnectorSlug;
    connectorVersion: string;
    hookEventName: ClaudeCodeHookEventName;
    eventType: NormalizedEventType;
    category: NormalizedEventCategory;
    occurredAt: string;
    confidence: ConfidenceLevel;
    severity: EventSeverity;
    sessionId: string | null;
    workingDirectory: string | null;
    toolName: string | null;
    toolUseId: string | null;
    summary: string;
    metadata: Record<string, unknown>;
}
/**
 * Maps a validated Claude Code hook payload into a metadata-first normalized event.
 * Raw file contents, edit diffs, and full prompts are excluded by default (FR-04, FR-05, FR-06).
 */
export declare class ClaudeCodeEventMapper {
    private readonly connectorVersion;
    constructor(connectorVersion?: string);
    /**
     * Maps a hook payload and tags it with the AI tool that actually produced it.
     * Summaries are built with the "Claude Code" prefix internally and re-labelled here.
     */
    mapHookToEvent(payload: ClaudeCodeHookPayload, connectorSlug?: ConnectorSlug): MappedClaudeCodeEvent;
    private mapPayload;
    private mapToolEvent;
    private buildEvent;
}
