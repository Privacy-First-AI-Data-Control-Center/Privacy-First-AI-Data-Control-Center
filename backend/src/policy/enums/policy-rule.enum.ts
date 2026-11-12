export enum RuleType{
    SENSITIVE_DATA = 'SENSITIVE_DATA',
    EVENT_TYPE = 'EVENT_TYPE',
    INTEGRATION = 'INTEGRATION',
}

export enum RuleEffect{
    ALLOW = 'ALLOW',
    WARN = 'WARN',
    REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
    REDACT = 'REDACT',
    BLOCK = 'BLOCK',
}