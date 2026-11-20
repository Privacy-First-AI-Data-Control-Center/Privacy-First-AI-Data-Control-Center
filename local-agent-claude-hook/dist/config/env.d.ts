import { z } from 'zod';
export declare const LOOPBACK_HOSTS: readonly ['127.0.0.1', 'localhost', '::1'];
export declare const NODE_ENVS: readonly ['development', 'production', 'test'];
export declare const LOG_LEVELS: readonly ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
export declare const DEV_DEFAULT_WEBHOOK_TOKEN = "dev-local-webhook-token-change-me";
export declare const EnvSchema: z.ZodPipe<z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    HOST: z.ZodDefault<z.ZodEnum<{
        "127.0.0.1": "127.0.0.1";
        "::1": "::1";
        localhost: "localhost";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        debug: "debug";
        error: "error";
        fatal: "fatal";
        info: "info";
        silent: "silent";
        trace: "trace";
        warn: "warn";
    }>>;
    BACKEND_BASE_URL: z.ZodDefault<z.ZodString>;
    LOCAL_WEBHOOK_TOKEN: z.ZodOptional<z.ZodString>;
    MAX_BODY_BYTES: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SQLITE_DB_PATH: z.ZodDefault<z.ZodString>;
    QUEUE_MAX_CAPACITY: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_DEVICE_ID: z.ZodDefault<z.ZodString>;
    AGENT_CREDENTIAL_TOKEN: z.ZodOptional<z.ZodString>;
    BACKEND_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>, z.ZodTransform<{
    NODE_ENV: "development" | "production" | "test";
    HOST: "127.0.0.1" | "::1" | "localhost";
    PORT: number;
    LOG_LEVEL: "debug" | "error" | "fatal" | "info" | "silent" | "trace" | "warn";
    BACKEND_BASE_URL: string;
    MAX_BODY_BYTES: number;
    SQLITE_DB_PATH: string;
    QUEUE_MAX_CAPACITY: number;
    AGENT_DEVICE_ID: string;
    AGENT_CREDENTIAL_TOKEN?: string | undefined;
    BACKEND_TIMEOUT_MS: number;
    LOCAL_WEBHOOK_TOKEN: string;
}, {
    NODE_ENV: "development" | "production" | "test";
    HOST: "127.0.0.1" | "::1" | "localhost";
    PORT: number;
    LOG_LEVEL: "debug" | "error" | "fatal" | "info" | "silent" | "trace" | "warn";
    BACKEND_BASE_URL: string;
    LOCAL_WEBHOOK_TOKEN?: string | undefined;
    MAX_BODY_BYTES: number;
    SQLITE_DB_PATH: string;
    QUEUE_MAX_CAPACITY: number;
    AGENT_DEVICE_ID: string;
    AGENT_CREDENTIAL_TOKEN?: string | undefined;
    BACKEND_TIMEOUT_MS: number;
}>>;
export type AppEnv = z.output<typeof EnvSchema>;
export declare function parseEnv(rawEnv?: Record<string, string | undefined>): Readonly<AppEnv>;
