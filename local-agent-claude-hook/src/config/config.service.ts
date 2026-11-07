import { config as loadDotenv } from 'dotenv';
import {
  type AppEnv,
  DEV_DEFAULT_WEBHOOK_TOKEN,
  parseEnv,
} from './env.js';

export interface ConfigServiceOptions {
 
  env?: Record<string, string | undefined>;
  
  envFilePath?: string;
 
  skipDotenv?: boolean;
}

export class ConfigService {
  private readonly config: Readonly<AppEnv>;

  constructor(options: ConfigServiceOptions = {}) {
    if (!options.skipDotenv && !options.env) {
      loadDotenv(options.envFilePath ? { path: options.envFilePath } : undefined);
    }

    this.config = parseEnv(options.env ?? process.env);
  }

  public get all(): Readonly<AppEnv> {
    return this.config;
  }

  public get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.config.NODE_ENV;
  }

  public get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  public get host(): AppEnv['HOST'] {
    return this.config.HOST;
  }

  public get port(): number {
    return this.config.PORT;
  }

  public get logLevel(): AppEnv['LOG_LEVEL'] {
    return this.config.LOG_LEVEL;
  }

  public get backendBaseUrl(): string {
    return this.config.BACKEND_BASE_URL;
  }

  public get localWebhookToken(): string {
    return this.config.LOCAL_WEBHOOK_TOKEN;
  }

  public get isUsingDefaultDevToken(): boolean {
    return this.config.LOCAL_WEBHOOK_TOKEN === DEV_DEFAULT_WEBHOOK_TOKEN;
  }

  public get maxBodyBytes(): number {
    return this.config.MAX_BODY_BYTES;
  }

  public get sqliteDbPath(): string {
    return this.config.SQLITE_DB_PATH;
  }

  public get queueMaxCapacity(): number {
    return this.config.QUEUE_MAX_CAPACITY;
  }

  public get agentDeviceId(): string {
    return this.config.AGENT_DEVICE_ID;
  }
}

let defaultConfigService: ConfigService | null = null;

export function getConfigService(): ConfigService {
  if (!defaultConfigService) {
    defaultConfigService = new ConfigService();
  }
  return defaultConfigService;
}
