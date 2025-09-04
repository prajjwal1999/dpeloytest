import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { TIMEOUT_CONSTANTS, HTTP_MESSAGES, HTTP_MESSAGES_EXTENDED } from '../../utils';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isAIRequest = request.url.includes('content-requests');
    
    // Use longer timeout for AI content generation requests
    const timeoutDuration = isAIRequest 
      ? TIMEOUT_CONSTANTS.AI_REQUEST_MS 
      : TIMEOUT_CONSTANTS.DEFAULT_REQUEST_MS;

    return next.handle().pipe(
      timeout(timeoutDuration),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () => new RequestTimeoutException(HTTP_MESSAGES_EXTENDED.REQUEST_TIMEOUT),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
