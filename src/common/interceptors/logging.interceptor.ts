import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { REQUEST_ID_CONSTANTS } from '../../utils';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params, query } = request;
    const startTime = Date.now();

    // Generate unique request ID for tracing
    const requestId = `${Date.now() * REQUEST_ID_CONSTANTS.TIMESTAMP_MULTIPLIER}-${Math.random()
      .toString(REQUEST_ID_CONSTANTS.RANDOM_STRING_BASE)
      .substr(REQUEST_ID_CONSTANTS.RANDOM_STRING_START_INDEX, REQUEST_ID_CONSTANTS.RANDOM_STRING_LENGTH)}`;
    request['requestId'] = requestId;

    this.logger.log(
      `[${requestId}] Incoming Request: ${method} ${url}`,
      {
        method,
        url,
        params,
        query,
        bodyKeys: Object.keys(body || {}),
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${requestId}] Request completed: ${method} ${url} - ${duration}ms`,
            {
              duration,
              responseSize: JSON.stringify(data).length,
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${requestId}] Request failed: ${method} ${url} - ${duration}ms`,
            {
              duration,
              error: error.message,
              stack: error.stack,
            },
          );
        },
      }),
    );
  }
}
