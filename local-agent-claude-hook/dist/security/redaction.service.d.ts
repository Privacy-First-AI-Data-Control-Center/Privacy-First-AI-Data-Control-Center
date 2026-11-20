export type SensitiveRuleId = 'PRIVATE_KEY_BLOCK' | 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY' | 'GITHUB_TOKEN' | 'AWS_ACCESS_KEY_ID' | 'SLACK_TOKEN' | 'JWT_TOKEN' | 'BEARER_TOKEN' | 'CLI_SECRET_FLAG' | 'CONNECTION_STRING_PASSWORD' | 'EMAIL_ADDRESS';
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
/**
 * Redacts sensitive patterns (API keys, tokens, credentials, connection string passwords,
 * private keys, and emails) from strings and nested metadata objects BEFORE persistence.
 */
export declare class RedactionService {
    private readonly rules;
    constructor(customRules?: readonly RedactionRule[]);
    redactString(input: string): RedactionOutcome<string>;
    redactObject<T>(value: T): RedactionOutcome<T>;
}
