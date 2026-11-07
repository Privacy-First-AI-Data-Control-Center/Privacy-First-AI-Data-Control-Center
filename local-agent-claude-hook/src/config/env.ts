import { z } from 'zod';

export const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '::1'] as const;
export const NODE_ENVS = ['development', 'production', 'test'] as const;
export const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

export const DEV_DEFAULT_WEBHOOK_TOKEN = 'dev-local-webhook-token-change-me';

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVS).default('development'),

    HOST: z.enum(LOOPBACK_HOSTS).default('127.0.0.1'),

    PORT: z.coerce
      .number()
      .int()
      .min(1, 'PORT must be between 1 and 65535')
      .max(65535, 'PORT must be between 1 and 65535')
      .default(43127),

    LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),

    BACKEND_BASE_URL: z
      .string()
      .url('BACKEND_BASE_URL must be a valid URL')
      .refine(
        (val) => val.startsWith('http://') || val.startsWith('https://'),
        'BACKEND_BASE_URL must use http:// or https:// protocol',
      )
      .default('http://127.0.0.1:3001/api/v1'),

    LOCAL_WEBHOOK_TOKEN: z.string().trim().optional(),

    MAX_BODY_BYTES: z.coerce
      .number()
      .int()
      .positive('MAX_BODY_BYTES must be a positive integer')
      .max(10 * 1024 * 1024, 'MAX_BODY_BYTES cannot exceed 10MB (10485760)')
      .default(1_048_576), // 1 MB

    SQLITE_DB_PATH: z
      .string()
      .trim()
      .min(1, 'SQLITE_DB_PATH cannot be empty')
      .default('data/agent-queue.db'),

    QUEUE_MAX_CAPACITY: z.coerce
      .number()
      .int()
      .positive('QUEUE_MAX_CAPACITY must be a positive integer')
      .max(100_000, 'QUEUE_MAX_CAPACITY cannot exceed 100000')
      .default(5_000),

    AGENT_DEVICE_ID: z
      .string()
      .trim()
      .min(1)
      .default('local-unregistered-device'),
  })
  .transform((data, ctx) => {
    const rawToken = data.LOCAL_WEBHOOK_TOKEN;

    if (data.NODE_ENV === 'production') {
      if (!rawToken || rawToken.length < 16) {
        ctx.addIssue({
          code: 'custom',
          path: ['LOCAL_WEBHOOK_TOKEN'],
          message:
            'LOCAL_WEBHOOK_TOKEN is required in production and must be at least 16 characters',
        });
        return z.NEVER;
      }
      if (rawToken === DEV_DEFAULT_WEBHOOK_TOKEN) {
        ctx.addIssue({
          code: 'custom',
          path: ['LOCAL_WEBHOOK_TOKEN'],
          message:
            'LOCAL_WEBHOOK_TOKEN cannot use the default development token in production',
        });
        return z.NEVER;
      }
      return {
        ...data,
        LOCAL_WEBHOOK_TOKEN: rawToken,
      };
    }

    const token =
      rawToken && rawToken.length > 0 ? rawToken : DEV_DEFAULT_WEBHOOK_TOKEN;

    if (token.length < 16) {
      ctx.addIssue({
        code: 'custom',
        path: ['LOCAL_WEBHOOK_TOKEN'],
        message: 'LOCAL_WEBHOOK_TOKEN must be at least 16 characters',
      });
      return z.NEVER;
    }

    return {
      ...data,
      LOCAL_WEBHOOK_TOKEN: token,
    };
  });

export type AppEnv = z.output<typeof EnvSchema>;

export function parseEnv(
  rawEnv: Record<string, string | undefined> = process.env,
): Readonly<AppEnv> {
  const result = EnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`[Invalid Environment Configuration] ${formatted}`);
  }

  return Object.freeze(result.data);
}
