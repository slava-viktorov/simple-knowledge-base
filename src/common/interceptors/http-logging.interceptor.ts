import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { id?: string; user?: { id: string } }>();
    const { method, originalUrl } = req;
    const userAgent = req.headers['user-agent'];
    const query = req.query;
    const startedAt = Date.now();
    const requestId = req.id;
    const userId = req.user?.id;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        const res = context.switchToHttp().getResponse<{
          statusCode?: number;
          getHeader?: (name: string) => unknown;
        }>();
        const statusCode =
          typeof res?.statusCode === 'number' ? res.statusCode : 0;
        const responseContentLength =
          typeof res?.getHeader === 'function'
            ? res.getHeader('content-length')
            : undefined;
        const log = {
          method,
          url: originalUrl,
          statusCode,
          durationMs: ms,
          requestId,
          userId,
          userAgent,
          query,
          responseContentLength,
        };
        this.logger.log(JSON.stringify(log));
      }),
    );
  }
}
