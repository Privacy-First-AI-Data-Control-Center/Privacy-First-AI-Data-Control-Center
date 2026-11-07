import { describe, expect, it } from 'vitest';
import { RedactionService } from '../../src/security/redaction.service.js';

describe('Stage 4: RedactionService (Sensitive Data Masking)', () => {
  const redactor = new RedactionService();

  it('redacts OpenAI, Anthropic, GitHub, and AWS API keys in command strings', () => {
    const rawCommand =
      'OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnop ANTHROPIC_KEY=sk-ant-api03-abcdef1234567890 GH_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv AWS_ID=AKIAIOSFODNN7EXAMPLE node script.js';

    const result = redactor.redactString(rawCommand);

    expect(result.applied).toBe(true);
    expect(result.data).not.toContain('sk-proj-1234567890abcdefghijklmnop');
    expect(result.data).not.toContain('sk-ant-api03-abcdef1234567890');
    expect(result.data).not.toContain('ghp_1234567890abcdefghijklmnopqrstuv');
    expect(result.data).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(result.matchedRules).toEqual(
      expect.arrayContaining([
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'GITHUB_TOKEN',
        'AWS_ACCESS_KEY_ID',
      ]),
    );
  });

  it('redacts PostgreSQL connection string passwords, CLI --password flags, and emails', () => {
    const raw =
      'psql postgresql://admin:SuperSecretDbPass99!@localhost:5432/privacy_db --password=myCliPass123 --user dev@example.com';

    const result = redactor.redactString(raw);

    expect(result.applied).toBe(true);
    expect(result.data).not.toContain('SuperSecretDbPass99!');
    expect(result.data).not.toContain('myCliPass123');
    expect(result.data).not.toContain('dev@example.com');
    expect(result.data).toContain('[REDACTED:DB_PASSWORD]');
    expect(result.data).toContain('[REDACTED:SECRET]');
    expect(result.data).toContain('[REDACTED:EMAIL]');
  });

  it('redacts nested metadata objects and sensitive object property keys', () => {
    const rawMetadata = {
      tool: 'Bash',
      command: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc1234567890" https://api.example.com',
      apiKey: 'plain-secret-in-sensitive-key',
      nested: {
        privateKey:
          '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA12345\n-----END RSA PRIVATE KEY-----',
      },
    };

    const result = redactor.redactObject(rawMetadata);

    expect(result.applied).toBe(true);
    const serialized = JSON.stringify(result.data);
    expect(serialized).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(serialized).not.toContain('plain-secret-in-sensitive-key');
    expect(serialized).not.toContain('MIIEpAIBAAKCAQEA12345');
  });
});
