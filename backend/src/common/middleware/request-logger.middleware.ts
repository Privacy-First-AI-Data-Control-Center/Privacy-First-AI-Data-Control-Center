import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const startTime = Date.now();

    // Attach unique Request ID to response header so clients/Swagger can trace every request
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms [${requestId}]`,
      );
    });

    next();
  }
}
