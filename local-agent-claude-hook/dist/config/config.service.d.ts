import { type AppEnv } from './env.js';
export interface ConfigServiceOptions {
    env?: Record<string, string | undefined>;
    envFilePath?: string;
    skipDotenv?: boolean;
}
export declare class ConfigService {
    private readonly config;
    constructor(options?: ConfigServiceOptions);
    get all(): Readonly<AppEnv>;
    get nodeEnv(): AppEnv['NODE_ENV'];
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get isTest(): boolean;
    get host(): AppEnv['HOST'];
    get port(): number;
    get logLevel(): AppEnv['LOG_LEVEL'];
    get backendBaseUrl(): string;
    get localWebhookToken(): string;
    get isUsingDefaultDevToken(): boolean;
    get maxBodyBytes(): number;
    get sqliteDbPath(): string;
    get queueMaxCapacity(): number;
    get agentDeviceId(): string;
    get agentCredentialToken(): string | undefined;
    get backendTimeoutMs(): number;
}
export declare function getConfigService(): ConfigService;
