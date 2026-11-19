import { describe, expect, it } from 'vitest';
import { ClaudeCodeConnectorService } from '../../src/connectors/claude-code/connector.service.js';
import { ClaudeCodeEventMapper } from '../../src/connectors/claude-code/event-mapper.js';

describe('Stage 3: Claude Code Connector & Event Mapper', () => {
  const mapper = new ClaudeCodeEventMapper('1.0.0');
  const connectorService = new ClaudeCodeConnectorService({
    version: '1.0.0',
    eventMapper: mapper,
  });

  it('declares connector capabilities and explicitly marks blind spots as unavailable', () => {
    const metadata = connectorService.getConnectorMetadata();

    expect(metadata.slug).toBe('claude-code');
    expect(metadata.integrationMethod).toBe('native_http_hooks');

    const observed = metadata.capabilities.filter(
      (c) => c.availability === 'observed',
    );
    const unavailable = metadata.capabilities.filter(
      (c) => c.availability === 'unavailable',
    );

    expect(observed.length).toBeGreaterThanOrEqual(4);
    expect(unavailable.map((c) => c.capabilityCode)).toEqual(
      expect.arrayContaining([
        'os.camera_microphone.monitoring',
        'provider.encrypted_network_payloads',
      ]),
    );
    expect(metadata.knownLimitations.length).toBeGreaterThan(0);
  });

  it('maps PostToolUse Bash events to tool.command.completed with metadata', () => {
    const event = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      session_id: 'sess-101',
      cwd: '/home/shohag-rana/app',
      tool_name: 'Bash',
      tool_input: {
        command: 'npm run build',
        description: 'Build TypeScript project',
      },
    });

    expect(event.eventType).toBe('tool.command.completed');
    expect(event.category).toBe('command_execution');
    expect(event.confidence).toBe('observed');
    expect(event.severity).toBe('info');
    expect(event.metadata).toMatchObject({
      tool: 'Bash',
      phase: 'completed',
      command: 'npm run build',
      workingDirectory: '/home/shohag-rana/app',
      outcome: 'success',
    });
  });

  it('elevates severity to high for destructive Bash commands (e.g. rm -rf or sudo)', () => {
    const event = mapper.mapHookToEvent({
      hook_event_name: 'PreToolUse',
      session_id: 'sess-102',
      cwd: '/home/shohag-rana/app',
      tool_name: 'Bash',
      tool_input: {
        command: 'sudo rm -rf /tmp/test-dir',
      },
    });

    expect(event.eventType).toBe('tool.command.started');
    expect(event.severity).toBe('high');
  });

  it('maps Write tool events to file.write and excludes raw file content (metadata-first)', () => {
    const secretFileContent = 'OPENAI_API_KEY=sk-1234567890abcdef';

    const event = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      session_id: 'sess-103',
      cwd: '/home/shohag-rana/app',
      tool_name: 'Write',
      tool_input: {
        file_path: '/home/shohag-rana/app/.env',
        content: secretFileContent,
      },
    });

    expect(event.eventType).toBe('file.write');
    expect(event.category).toBe('file_access');
    expect(event.severity).toBe('high'); // .env is flagged as a sensitive path
    expect(event.metadata).toMatchObject({
      tool: 'Write',
      operation: 'write',
      filePath: '/home/shohag-rana/app/.env',
      isSensitivePath: true,
      contentByteLength: Buffer.byteLength(secretFileContent, 'utf8'),
      fileContentCaptured: false,
    });
    // Ensure raw file content is NEVER copied into metadata
    expect(JSON.stringify(event)).not.toContain(secretFileContent);
  });

  it('maps Read and Grep tools to file.read and file.search', () => {
    const readEvent = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      tool_name: 'Read',
      tool_input: {
        file_path: '/workspace/src/main.ts',
        offset: 1,
        limit: 100,
      },
    });

    expect(readEvent.eventType).toBe('file.read');
    expect(readEvent.severity).toBe('info');
    expect(readEvent.metadata).toMatchObject({
      filePath: '/workspace/src/main.ts',
      isSensitivePath: false,
      fileContentCaptured: false,
    });

    const grepEvent = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      tool_name: 'Grep',
      tool_input: {
        path: '/workspace/src',
        pattern: 'PASSWORD',
      },
    });

    expect(grepEvent.eventType).toBe('file.search');
    expect(grepEvent.metadata).toMatchObject({
      tool: 'Grep',
      targetPath: '/workspace/src',
      pattern: 'PASSWORD',
    });
  });

  it('maps WebFetch tool to network.request', () => {
    const webEvent = mapper.mapHookToEvent({
      hook_event_name: 'PostToolUse',
      tool_name: 'WebFetch',
      tool_input: {
        url: 'https://docs.anthropic.com/en/docs/claude-code/hooks',
      },
    });

    expect(webEvent.eventType).toBe('network.request');
    expect(webEvent.category).toBe('network_access');
    expect(webEvent.metadata).toMatchObject({
      tool: 'WebFetch',
      url: 'https://docs.anthropic.com/en/docs/claude-code/hooks',
      payloadContentCaptured: false,
    });
  });
});
