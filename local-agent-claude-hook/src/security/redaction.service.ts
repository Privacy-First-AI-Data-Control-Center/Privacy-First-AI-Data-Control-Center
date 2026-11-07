export type SensitiveRuleId =
  | 'PRIVATE_KEY_BLOCK'
  | 'ANTHROPIC_API_KEY'
  | 'OPENAI_API_KEY'
  | 'GITHUB_TOKEN'
  | 'AWS_ACCESS_KEY_ID'
  | 'SLACK_TOKEN'
  | 'JWT_TOKEN'
  | 'BEARER_TOKEN'
  | 'CLI_SECRET_FLAG'
  | 'CONNECTION_STRING_PASSWORD'
  | 'EMAIL_ADDRESS';

export interface RedactionRule {
  id: SensitiveRuleId;
  pattern: RegExp;
  replacement: string;
}

export interface RedactionOutcome<T> {
  data: T;
  applied: boolean;
  matchedRules: SensitiveRuleId[];
  redactedCount: number;
}

const DEFAULT_REDACTION_RULES: readonly RedactionRule[] = [
  {
    id: 'PRIVATE_KEY_BLOCK',
    pattern:
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    replacement: '[REDACTED:PRIVATE_KEY]',
  },
  {
    id: 'ANTHROPIC_API_KEY',
    pattern: /\bsk-ant-[a-zA-Z0-9_-]{12,}\b/g,
    replacement: '[REDACTED:ANTHROPIC_API_KEY]',
  },
  {
    id: 'OPENAI_API_KEY',
    pattern: /\bsk-(?:proj-|svcacct-)?[a-zA-Z0-9_-]{16,}\b/g,
    replacement: '[REDACTED:OPENAI_API_KEY]',
  },
  {
    id: 'GITHUB_TOKEN',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
    replacement: '[REDACTED:GITHUB_TOKEN]',
  },
  {
    id: 'AWS_ACCESS_KEY_ID',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: '[REDACTED:AWS_ACCESS_KEY]',
  },
  {
    id: 'SLACK_TOKEN',
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
    replacement: '[REDACTED:SLACK_TOKEN]',
  },
  {
    id: 'JWT_TOKEN',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    replacement: '[REDACTED:JWT]',
  },
  {
    id: 'BEARER_TOKEN',
    pattern: /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}\b/gi,
    replacement: '$1[REDACTED:BEARER_TOKEN]',
  },
  {
    id: 'CONNECTION_STRING_PASSWORD',
    pattern: /\b((?:postgres|postgresql|mysql|mongodb|redis|amqp)s?:\/\/[^:\s/]+:)([^@\s]+)(@)/gi,
    replacement: '$1[REDACTED:DB_PASSWORD]$3',
  },
  {
    id: 'CLI_SECRET_FLAG',
    pattern:
      /((?:--?(?:password|passwd|pass|token|secret|api-?key|access-?key|client-?secret|auth-?token)|(?:PASSWORD|TOKEN|SECRET|API_KEY|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET))\s*(?:=|:|\s+)\s*)(['"]?)(?!\[REDACTED:)([^\s'"]+)\2/gi,
    replacement: '$1$2[REDACTED:SECRET]$2',
  },
  {
    id: 'EMAIL_ADDRESS',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[REDACTED:EMAIL]',
  },
];

const SENSITIVE_KEY_NAME_REGEX =
  /^(?:password|passwd|secret|token|api_?key|access_?token|refresh_?token|private_?key|client_?secret|authorization|x-webhook-token)$/i;

/**
 * Redacts sensitive patterns (API keys, tokens, credentials, connection string passwords,
 * private keys, and emails) from strings and nested metadata objects BEFORE persistence.
 */
export class RedactionService {
  private readonly rules: readonly RedactionRule[];

  constructor(customRules?: readonly RedactionRule[]) {
    this.rules = customRules ?? DEFAULT_REDACTION_RULES;
  }

  public redactString(input: string): RedactionOutcome<string> {
    let current = input;
    const matchedRules = new Set<SensitiveRuleId>();
    let redactedCount = 0;

    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      const matches = current.match(regex);
      if (matches && matches.length > 0) {
        matchedRules.add(rule.id);
        redactedCount += matches.length;
        current = current.replace(regex, rule.replacement);
      }
    }

    return {
      data: current,
      applied: redactedCount > 0,
      matchedRules: Array.from(matchedRules),
      redactedCount,
    };
  }

  public redactObject<T>(value: T): RedactionOutcome<T> {
    const matchedRules = new Set<SensitiveRuleId>();
    let redactedCount = 0;

    const visit = (node: unknown, keyName?: string): unknown => {
      if (node === null || node === undefined) {
        return node;
      }

      if (typeof node === 'string') {
        if (keyName && SENSITIVE_KEY_NAME_REGEX.test(keyName) && node.length > 0) {
          matchedRules.add('CLI_SECRET_FLAG');
          redactedCount += 1;
          return '[REDACTED:SENSITIVE_KEY]';
        }

        const result = this.redactString(node);
        if (result.applied) {
          for (const ruleId of result.matchedRules) {
            matchedRules.add(ruleId);
          }
          redactedCount += result.redactedCount;
        }
        return result.data;
      }

      if (Array.isArray(node)) {
        return node.map((item) => visit(item));
      }

      if (typeof node === 'object') {
        const output: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          output[k] = visit(v, k);
        }
        return output;
      }

      return node;
    };

    const sanitized = visit(value) as T;

    return {
      data: sanitized,
      applied: redactedCount > 0,
      matchedRules: Array.from(matchedRules),
      redactedCount,
    };
  }
}
