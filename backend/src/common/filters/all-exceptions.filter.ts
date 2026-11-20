import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = HttpStatus[statusCode] ?? 'Error';
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message =
          (body.message as string | string[] | undefined) ?? exception.message;
        error =
          typeof body.error === 'string'
            ? body.error
            : (HttpStatus[statusCode] ?? 'Error');
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as
        | { code?: string; detail?: string }
        | undefined;
      const pgCode = driverError?.code;

      if (pgCode === '23505') {
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message =
          driverError?.detail ??
          'A record with this unique value already exists';
      } else if (pgCode === '23503') {
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Referenced resource does not exist';
      } else if (pgCode === '22P02') {
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Invalid identifier or input format';
      } else {
        this.logger.error(
          `Database error on ${request.method} ${request.url}: ${exception.message}`,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
