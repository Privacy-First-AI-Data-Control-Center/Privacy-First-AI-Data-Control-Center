import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';

const SENSITIVE_KEYS = new Set(['passwordHash', 'password_hash']);

function stripSensitiveFields(value: unknown): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    value instanceof Date ||
    Buffer.isBuffer(value) ||
    value instanceof StreamableFile
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = stripSensitiveFields(val);
  }
  return sanitized;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const durationMs = Date.now() - startTime;
        if (!response.headersSent) {
          response.setHeader('X-Response-Time', `${durationMs}ms`);
        }

       
        if (
          data === null ||
          data === undefined ||
          typeof data !== 'object' ||
          data instanceof StreamableFile ||
          Buffer.isBuffer(data)
        ) {
          return data;
        }

        return stripSensitiveFields(data);
      }),
    );
  }
}
