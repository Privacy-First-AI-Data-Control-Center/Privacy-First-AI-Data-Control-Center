import {
  ClaudeCodeEventMapper,
  type ConfidenceLevel,
  type MappedClaudeCodeEvent,
} from './event-mapper.js';
import type { ClaudeCodeHookPayload } from './hook-handler.js';

export interface ConnectorCapabilityDescriptor {
  capabilityCode: string;
  availability: ConfidenceLevel;
  evidenceSource: string;
  supportsEnforcement: boolean;
  description: string;
}

export interface ConnectorMetadata {
  slug: 'claude-code';
  displayName: string;
  vendor: string;
  version: string;
  integrationMethod: 'native_http_hooks';
  capabilities: readonly ConnectorCapabilityDescriptor[];
  knownLimitations: readonly string[];
}

export class ClaudeCodeConnectorService {
  private readonly eventMapper: ClaudeCodeEventMapper;
  private readonly version: string;

  constructor(options: { version?: string; eventMapper?: ClaudeCodeEventMapper } = {}) {
    this.version = options.version ?? '1.0.0';
    this.eventMapper = options.eventMapper ?? new ClaudeCodeEventMapper(this.version);
  }

  public getConnectorMetadata(): ConnectorMetadata {
    return {
      slug: 'claude-code',
      displayName: 'Claude Code CLI',
      vendor: 'Anthropic',
      version: this.version,
      integrationMethod: 'native_http_hooks',
      capabilities: [
        {
          capabilityCode: 'tool.command.monitoring',
          availability: 'observed',
          evidenceSource: 'Claude Code PreToolUse / PostToolUse / PostToolUseFailure hooks (Bash)',
          supportsEnforcement: true,
          description:
            'Observes Bash command execution metadata and supports pre-execution policy checks via PreToolUse.',
        },
        {
          capabilityCode: 'file.access.monitoring',
          availability: 'observed',
          evidenceSource: 'Claude Code tool hooks (Read, Write, Edit, MultiEdit, Glob, Grep)',
          supportsEnforcement: true,
          description:
            'Observes file paths and operation types without copying raw file contents by default.',
        },
        {
          capabilityCode: 'network.tool.monitoring',
          availability: 'observed',
          evidenceSource: 'Claude Code tool hooks (WebFetch, WebSearch)',
          supportsEnforcement: true,
          description:
            'Observes explicit WebFetch/WebSearch tool invocations; does not inspect arbitrary OS socket payloads.',
        },
        {
          capabilityCode: 'ai.session.lifecycle',
          availability: 'observed',
          evidenceSource: 'Claude Code SessionStart / SessionEnd / Stop hooks',
          supportsEnforcement: false,
          description: 'Tracks when Claude Code sessions start and stop.',
        },
        {
          capabilityCode: 'os.camera_microphone.monitoring',
          availability: 'unavailable',
          evidenceSource: 'Not exposed by Claude Code hooks',
          supportsEnforcement: false,
          description:
            'Claude Code hooks do not report hardware camera or microphone access; requires OS telemetry.',
        },
        {
          capabilityCode: 'provider.encrypted_network_payloads',
          availability: 'unavailable',
          evidenceSource: 'Encrypted HTTPS traffic to Anthropic API',
          supportsEnforcement: false,
          description:
            'Internal model API network payloads are TLS-encrypted and not exposed by tool hooks.',
        },
      ],
      knownLimitations: [
        'Hook coverage only observes operations routed through Claude Code lifecycle hooks.',
        'Background child processes spawned by a shell command may perform actions outside hook visibility.',
        'PostToolUse events are observational and cannot retroactively block an already-executed command.',
      ],
    };
  }

  public normalizeHookPayload(payload: ClaudeCodeHookPayload): MappedClaudeCodeEvent {
    return this.eventMapper.mapHookToEvent(payload);
  }
}
