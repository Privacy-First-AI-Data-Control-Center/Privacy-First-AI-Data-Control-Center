export enum EnforcementActionType{
    ALLOW = 'ALLOW',
    WARN = 'WARN',
    REDACT = 'REDACT',
    BLOCK = 'BLOCK',
}
export enum EnforcementOutcome{
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    UNSUPPORTED = 'UNSUPPORTED',
    NOT_ATTEMPTED = 'NOT_ATTEMPTED',
}