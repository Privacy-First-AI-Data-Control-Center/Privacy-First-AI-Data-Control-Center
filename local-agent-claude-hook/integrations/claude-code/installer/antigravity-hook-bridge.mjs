#!/usr/bin/env node
/**
 * Privacy-First AI Data Control Center — Antigravity & Gemini CLI Hook Bridge
 *
 * Why this bridge exists:
 * Antigravity (`~/.gemini/config/hooks.json`) and Gemini CLI (`~/.gemini/settings.json`)
 * only support `"type": "command"` hooks that pass JSON on stdin and expect JSON on stdout.
 *
 * This script:
 * 1. Reads the Antigravity / Gemini CLI hook payload from stdin.
 * 2. Translates tool names (`run_command` -> `Bash`, `read_file`/`view_file` -> `Read`,
 *    `write_file`/`write_to_file` -> `Write`, `edit_file`/`replace_file_content` -> `Edit`, etc.).
 * 3. Sends the HTTP POST webhook to `http://127.0.0.1:43127/hooks/claude-code` (non-blocking, 2s timeout).
 * 4. Outputs the exact JSON stdout response required by Antigravity / Gemini CLI so tool execution is never broken.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hookEventArg = process.argv[2] || 'PostToolUse';
// Which AI tool is calling this bridge: 'antigravity' (default) or 'gemini-cli'.
const SUPPORTED_SOURCES = new Set(['antigravity', 'gemini-cli']);
const sourceArg = SUPPORTED_SOURCES.has(process.argv[3]) ? process.argv[3] : 'antigravity';

function loadEnvConfig() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const agentRoot = resolve(scriptDir, '../../..');
  const envPath = resolve(agentRoot, '.env');

  let port = process.env.PORT || '43127';
  let token =
    process.env.LOCAL_WEBHOOK_TOKEN ||
    'replace-with-secure-local-webhook-token-min-16-chars';

  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('PORT=')) {
        port = trimmed.slice('PORT='.length).trim().replace(/^['"]|['"]$/g, '');
      } else if (trimmed.startsWith('LOCAL_WEBHOOK_TOKEN=')) {
        token = trimmed
          .slice('LOCAL_WEBHOOK_TOKEN='.length)
          .trim()
          .replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // Use defaults if .env is not readable
  }

  return {
    url: `http://127.0.0.1:${port}/hooks/${sourceArg}`,
    token,
  };
}

function mapToolNameAndInput(rawToolName, rawArgs) {
  const name = String(rawToolName || 'unknown').toLowerCase();
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};

  if (name === 'run_command' || name === 'bash' || name === 'shell') {
    return {
      tool_name: 'Bash',
      tool_input: {
        command: args.CommandLine || args.command || args.cmd || '',
        description: args.toolSummary || args.description || undefined,
      },
    };
  }

  if (name === 'read_file' || name === 'view_file' || name === 'read') {
    return {
      tool_name: 'Read',
      tool_input: {
        file_path: args.Path || args.AbsolutePath || args.file_path || args.path || '',
        offset: args.StartLine || args.offset || undefined,
        limit: args.EndLine || args.limit || undefined,
      },
    };
  }

  if (name === 'write_file' || name === 'write_to_file' || name === 'write') {
    return {
      tool_name: 'Write',
      tool_input: {
        file_path: args.Path || args.TargetFile || args.file_path || args.path || '',
        content: typeof args.Content === 'string' ? args.Content : typeof args.CodeContent === 'string' ? args.CodeContent : '',
      },
    };
  }

  if (
    name === 'edit_file' ||
    name === 'replace_file_content' ||
    name === 'multi_replace_file_content' ||
    name === 'edit'
  ) {
    return {
      tool_name: 'Edit',
      tool_input: {
        file_path: args.Path || args.TargetFile || args.file_path || args.path || '',
      },
    };
  }

  if (name === 'search_web' || name === 'read_url_content') {
    return {
      tool_name: 'WebSearch',
      tool_input: {
        query: args.query || undefined,
        url: args.Url || args.url || undefined,
      },
    };
  }

  if (name === 'grep_search' || name === 'find_by_name') {
    return {
      tool_name: 'Grep',
      tool_input: {
        path: args.SearchPath || args.SearchDirectory || args.path || '',
        pattern: args.Query || args.Pattern || args.pattern || '',
      },
    };
  }

  return {
    tool_name: String(rawToolName || 'antigravity_tool'),
    tool_input: args,
  };
}

async function main() {
  let rawStdin = '';
  try {
    rawStdin = readFileSync(0, 'utf8');
  } catch {
    rawStdin = '{}';
  }

  let input = {};
  try {
    input = rawStdin.trim() ? JSON.parse(rawStdin) : {};
  } catch {
    input = {};
  }

  // Normalize event name to valid hook_event_name
  const validEvents = new Set([
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
  ]);

  let hookEventName = validEvents.has(hookEventArg) ? hookEventArg : 'PostToolUse';
  if (hookEventName === 'PostToolUse' && input.error) {
    hookEventName = 'PostToolUseFailure';
  }

  const sessionId =
    input.conversationId || input.session_id || input.sessionId || 'antigravity-session';
  const cwd =
    Array.isArray(input.workspacePaths) && input.workspacePaths.length > 0
      ? input.workspacePaths[0]
      : input.cwd || process.cwd();

  const rawToolName =
    input.toolCall?.name || input.tool_name || input.toolName || 'antigravity_tool';
  const rawToolArgs =
    input.toolCall?.args || input.tool_input || input.toolInput || {};

  const mappedTool = mapToolNameAndInput(rawToolName, rawToolArgs);

  const payload = {
    hook_event_name: hookEventName,
    session_id: String(sessionId),
    cwd: String(cwd),
    ...(hookEventName === 'PreToolUse' ||
    hookEventName === 'PostToolUse' ||
    hookEventName === 'PostToolUseFailure'
      ? {
          tool_name: mappedTool.tool_name,
          tool_use_id:
            input.stepIdx !== undefined
              ? `${sessionId}-step-${input.stepIdx}`
              : undefined,
          tool_input: mappedTool.tool_input,
          ...(input.error ? { error: String(input.error) } : {}),
        }
      : {}),
  };

  const { url, token } = loadEnvConfig();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-token': token,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Never block Antigravity / Gemini CLI if the local agent server is stopped
  }

  // Output the exact JSON contract expected by Antigravity / Gemini CLI
  if (hookEventArg === 'PreToolUse') {
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  } else {
    process.stdout.write('{}\n');
  }
}

await main();
