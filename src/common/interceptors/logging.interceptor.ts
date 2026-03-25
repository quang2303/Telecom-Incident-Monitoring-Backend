import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as rtracer from 'cls-rtracer';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const initialTime = Date.now();
    const requestId = rtracer.id();

    const bodyStr = JSON.stringify(req.body || {}, (key, value) => {
      if (key.toLowerCase() === 'password' || key.toLowerCase() === 'token') {
        return '***REDACTED***';
      }
      return value;
    });

    if (bodyStr !== '{}') {
      this.logger.log(`[${requestId || 'NO_REQ_ID'}] -> [${method}] ${url} Body: ${bodyStr}`);
    } else {
      this.logger.log(`[${requestId || 'NO_REQ_ID'}] -> [${method}] ${url}`);
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `[${requestId || 'NO_REQ_ID'}] <- [${method}] ${url} - ${Date.now() - initialTime}ms`,
        );
      }),
    );
  }
}
