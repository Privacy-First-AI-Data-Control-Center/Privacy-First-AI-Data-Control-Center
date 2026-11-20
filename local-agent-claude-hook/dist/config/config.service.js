import { config as loadDotenv } from 'dotenv';
import { DEV_DEFAULT_WEBHOOK_TOKEN, parseEnv, } from './env.js';
export class ConfigService {
    config;
    constructor(options = {}) {
        if (!options.skipDotenv && !options.env) {
            loadDotenv(options.envFilePath ? { path: options.envFilePath } : undefined);
        }
        this.config = parseEnv(options.env ?? process.env);
    }
    get all() {
        return this.config;
    }
    get nodeEnv() {
        return this.config.NODE_ENV;
    }
    get isDevelopment() {
        return this.config.NODE_ENV === 'development';
    }
    get isProduction() {
        return this.config.NODE_ENV === 'production';
    }
    get isTest() {
        return this.config.NODE_ENV === 'test';
    }
    get host() {
        return this.config.HOST;
    }
    get port() {
        return this.config.PORT;
    }
    get logLevel() {
        return this.config.LOG_LEVEL;
    }
    get backendBaseUrl() {
        return this.config.BACKEND_BASE_URL;
    }
    get localWebhookToken() {
        return this.config.LOCAL_WEBHOOK_TOKEN;
    }
    get isUsingDefaultDevToken() {
        return this.config.LOCAL_WEBHOOK_TOKEN === DEV_DEFAULT_WEBHOOK_TOKEN;
    }
    get maxBodyBytes() {
        return this.config.MAX_BODY_BYTES;
    }
    get sqliteDbPath() {
        return this.config.SQLITE_DB_PATH;
    }
    get queueMaxCapacity() {
        return this.config.QUEUE_MAX_CAPACITY;
    }
    get agentDeviceId() {
        return this.config.AGENT_DEVICE_ID;
    }
    get agentCredentialToken() {
        return this.config.AGENT_CREDENTIAL_TOKEN;
    }
    get backendTimeoutMs() {
        return this.config.BACKEND_TIMEOUT_MS;
    }
}
let defaultConfigService = null;
export function getConfigService() {
    if (!defaultConfigService) {
        defaultConfigService = new ConfigService();
    }
    return defaultConfigService;
}
//# sourceMappingURL=config.service.js.map