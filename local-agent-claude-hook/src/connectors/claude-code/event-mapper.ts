import { randomUUID } from 'node:crypto';
import type { ClaudeCodeHookEventName, ClaudeCodeHookPayload } from './hook-handler.js';

export type ConfidenceLevel = 'observed' | 'inferred' | 'unavailable';
export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type NormalizedEventCategory =
  | 'ai_session'
  | 'command_execution'
  | 'file_access'
  | 'network_access'
  | 'prompt_interaction'
  | 'system_notification';

export type NormalizedEventType =
  | 'ai.session.started'
  | 'ai.session.ended'
  | 'ai.prompt.submitted'
  | 'ai.turn.stopped'
  | 'ai.subagent.stopped'
  | 'ai.context.compacting'
  | 'ai.notification.received'
  | 'tool.command.started'
  | 'tool.command.completed'
  | 'tool.command.failed'
  | 'file.read'
  | 'file.write'
  | 'file.edit'
  | 'file.search'
  | 'network.request'
  | 'tool.call.started'
  | 'tool.call.completed'
  | 'tool.call.failed';

export interface MappedClaudeCodeEvent {
  eventId: string;
  connectorSlug: 'claude-code';
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

const SENSITIVE_PATH_PATTERNS = [
  /(?:^|\/)\.env(?:\..+)?$/i,
  /(?:^|\/)\.ssh\//i,
  /(?:^|\/)\.aws\//i,
  /(?:^|\/)\.gnupg\//i,
  /id_rsa|id_ed25519|\.pem$|\.key$/i,
  /\/etc\/(?:passwd|shadow|sudoers)/i,
];

const HIGH_RISK_COMMAND_PATTERNS = [
  /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?\b/i,
  /\bsudo\b/i,
  /\bchmod\s+777\b/i,
  /\bcurl\b.*\|\s*(?:bash|sh|zsh)\b/i,
  /\bwget\b.*\|\s*(?:bash|sh|zsh)\b/i,
  /\bdd\s+if=/i,
  /\bmkfs\b/i,
];

function isSensitiveFilePath(filePath: string | null): boolean {
  if (!filePath) {
    return false;
  }
  return SENSITIVE_PATH_PATTERNS.some((regex) => regex.test(filePath));
}

function classifyCommandSeverity(
  command: string | null,
  isFailure: boolean,
): EventSeverity {
  if (command && HIGH_RISK_COMMAND_PATTERNS.some((regex) => regex.test(command))) {
    return 'high';
  }
  if (command && isSensitiveFilePath(command)) {
    return 'medium';
  }
  if (isFailure) {
    return 'low';
  }
  return 'info';
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function extractFilePath(toolInput: Record<string, unknown> | undefined): string | null {
  if (!toolInput) {
    return null;
  }
  return (
    asString(toolInput.file_path) ??
    asString(toolInput.path) ??
    asString(toolInput.notebook_path) ??
    null
  );
}

/**
 * Maps a validated Claude Code hook payload into a metadata-first normalized event.
 * Raw file contents, edit diffs, and full prompts are excluded by default (FR-04, FR-05, FR-06).
 */
export class ClaudeCodeEventMapper {
  private readonly connectorVersion: string;

  constructor(connectorVersion = '1.0.0') {
    this.connectorVersion = connectorVersion;
  }

  public mapHookToEvent(payload: ClaudeCodeHookPayload): MappedClaudeCodeEvent {
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();
    const hookName = payload.hook_event_name;
    const toolName = payload.tool_name ?? null;
    const toolInput = payload.tool_input;

    if (hookName === 'SessionStart') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.session.started',
        category: 'ai_session',
        severity: 'info',
        summary: 'Claude Code session started',
        metadata: {
          permissionMode: payload.permission_mode ?? null,
        },
      });
    }

    if (hookName === 'SessionEnd') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.session.ended',
        category: 'ai_session',
        severity: 'info',
        summary: 'Claude Code session ended',
        metadata: {},
      });
    }

    if (hookName === 'UserPromptSubmit') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.prompt.submitted',
        category: 'prompt_interaction',
        severity: 'info',
        summary: 'User submitted prompt to Claude Code (content excluded by metadata-first default)',
        metadata: {
          promptContentCaptured: false,
        },
      });
    }

    if (hookName === 'Stop') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.turn.stopped',
        category: 'ai_session',
        severity: 'info',
        summary: 'Claude Code turn completed',
        metadata: {},
      });
    }

    if (hookName === 'SubagentStop') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.subagent.stopped',
        category: 'ai_session',
        severity: 'info',
        summary: 'Claude Code subagent completed',
        metadata: {},
      });
    }

    if (hookName === 'PreCompact') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.context.compacting',
        category: 'ai_session',
        severity: 'info',
        summary: 'Claude Code context compaction triggered',
        metadata: {},
      });
    }

    if (hookName === 'Notification') {
      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'ai.notification.received',
        category: 'system_notification',
        severity: 'info',
        summary: 'Claude Code emitted notification event',
        metadata: {},
      });
    }

    // Tool-related events: PreToolUse, PostToolUse, PostToolUseFailure
    return this.mapToolEvent(eventId, occurredAt, payload, toolName, toolInput);
  }

  private mapToolEvent(
    eventId: string,
    occurredAt: string,
    payload: ClaudeCodeHookPayload,
    toolName: string | null,
    toolInput: Record<string, unknown> | undefined,
  ): MappedClaudeCodeEvent {
    const hookName = payload.hook_event_name;
    const isPre = hookName === 'PreToolUse';
    const isFailure = hookName === 'PostToolUseFailure';
    const phase = isPre ? 'pre_execution' : isFailure ? 'failed' : 'completed';

    // 1. Command execution tools (Bash)
    if (toolName === 'Bash') {
      const command = asString(toolInput?.command);
      const description = asString(toolInput?.description);
      const timeoutMs =
        typeof toolInput?.timeout === 'number' ? toolInput.timeout : null;

      const eventType: NormalizedEventType = isPre
        ? 'tool.command.started'
        : isFailure
          ? 'tool.command.failed'
          : 'tool.command.completed';

      const severity = classifyCommandSeverity(command, isFailure);

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType,
        category: 'command_execution',
        severity,
        summary: `Claude Code ${phase} Bash command`,
        metadata: {
          tool: 'Bash',
          phase,
          command,
          description,
          timeoutMs,
          workingDirectory: payload.cwd ?? null,
          outcome: isFailure ? 'failure' : isPre ? 'pending' : 'success',
          error: payload.error ?? null,
        },
      });
    }

    // 2. File read tools (Read)
    if (toolName === 'Read') {
      const filePath = extractFilePath(toolInput);
      const sensitivePath = isSensitiveFilePath(filePath);

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'file.read',
        category: 'file_access',
        severity: sensitivePath ? 'high' : 'info',
        summary: `Claude Code ${phase} file read${filePath ? `: ${filePath}` : ''}`,
        metadata: {
          tool: 'Read',
          phase,
          operation: 'read',
          filePath,
          isSensitivePath: sensitivePath,
          offset: typeof toolInput?.offset === 'number' ? toolInput.offset : null,
          limit: typeof toolInput?.limit === 'number' ? toolInput.limit : null,
          fileContentCaptured: false,
        },
      });
    }

    // 3. File write tools (Write, NotebookEdit)
    if (toolName === 'Write' || toolName === 'NotebookEdit') {
      const filePath = extractFilePath(toolInput);
      const sensitivePath = isSensitiveFilePath(filePath);
      const rawContent = typeof toolInput?.content === 'string' ? toolInput.content : null;

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'file.write',
        category: 'file_access',
        severity: sensitivePath ? 'high' : 'low',
        summary: `Claude Code ${phase} file write${filePath ? `: ${filePath}` : ''}`,
        metadata: {
          tool: toolName,
          phase,
          operation: 'write',
          filePath,
          isSensitivePath: sensitivePath,
          contentByteLength:
            rawContent !== null ? Buffer.byteLength(rawContent, 'utf8') : null,
          fileContentCaptured: false,
        },
      });
    }

    // 4. File edit tools (Edit, MultiEdit)
    if (toolName === 'Edit' || toolName === 'MultiEdit') {
      const filePath = extractFilePath(toolInput);
      const sensitivePath = isSensitiveFilePath(filePath);
      const editsArray = Array.isArray(toolInput?.edits) ? toolInput.edits : null;

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'file.edit',
        category: 'file_access',
        severity: sensitivePath ? 'high' : 'low',
        summary: `Claude Code ${phase} file edit${filePath ? `: ${filePath}` : ''}`,
        metadata: {
          tool: toolName,
          phase,
          operation: 'edit',
          filePath,
          isSensitivePath: sensitivePath,
          editCount: editsArray ? editsArray.length : 1,
          replaceAll:
            typeof toolInput?.replace_all === 'boolean'
              ? toolInput.replace_all
              : false,
          fileContentCaptured: false,
        },
      });
    }

    // 5. File / code search tools (Glob, Grep, LS)
    if (toolName === 'Glob' || toolName === 'Grep' || toolName === 'LS') {
      const targetPath = extractFilePath(toolInput);
      const pattern = asString(toolInput?.pattern);

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'file.search',
        category: 'file_access',
        severity: isSensitiveFilePath(targetPath) ? 'medium' : 'info',
        summary: `Claude Code ${phase} ${toolName} search`,
        metadata: {
          tool: toolName,
          phase,
          operation: 'search',
          targetPath: targetPath ?? payload.cwd ?? null,
          pattern,
        },
      });
    }

    // 6. Network / Web tools (WebFetch, WebSearch)
    if (toolName === 'WebFetch' || toolName === 'WebSearch') {
      const url = asString(toolInput?.url);
      const query = asString(toolInput?.query);

      return this.buildEvent({
        eventId,
        occurredAt,
        payload,
        eventType: 'network.request',
        category: 'network_access',
        severity: 'low',
        summary: `Claude Code ${phase} ${toolName} request`,
        metadata: {
          tool: toolName,
          phase,
          url,
          query,
          payloadContentCaptured: false,
        },
      });
    }

    // 7. Generic / MCP / Custom tools
    const fallbackType: NormalizedEventType = isPre
      ? 'tool.call.started'
      : isFailure
        ? 'tool.call.failed'
        : 'tool.call.completed';

    return this.buildEvent({
      eventId,
      occurredAt,
      payload,
      eventType: fallbackType,
      category: 'command_execution',
      severity: isFailure ? 'low' : 'info',
      summary: `Claude Code ${phase} tool ${toolName ?? 'unknown'}`,
      metadata: {
        tool: toolName,
        phase,
        inputKeys: toolInput ? Object.keys(toolInput) : [],
        error: payload.error ?? null,
      },
    });
  }

  private buildEvent(params: {
    eventId: string;
    occurredAt: string;
    payload: ClaudeCodeHookPayload;
    eventType: NormalizedEventType;
    category: NormalizedEventCategory;
    severity: EventSeverity;
    summary: string;
    metadata: Record<string, unknown>;
  }): MappedClaudeCodeEvent {
    const { payload } = params;
    return {
      eventId: params.eventId,
      connectorSlug: 'claude-code',
      connectorVersion: this.connectorVersion,
      hookEventName: payload.hook_event_name,
      eventType: params.eventType,
      category: params.category,
      occurredAt: params.occurredAt,
      confidence: 'observed',
      severity: params.severity,
      sessionId: payload.session_id ?? null,
      workingDirectory: payload.cwd ?? null,
      toolName: payload.tool_name ?? null,
      toolUseId: payload.tool_use_id ?? null,
      summary: params.summary,
      metadata: {
        ...params.metadata,
        permissionMode: payload.permission_mode ?? null,
      },
    };
  }
}
