import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as rtracer from 'cls-rtracer';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      errorCode = 'HTTP_EXCEPTION';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint failed';
        errorCode = 'P2002';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        errorCode = 'P2025';
      } else {
        message = exception.message;
        errorCode = exception.code;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestId = rtracer.id();

    // Normalize response if message is an object (like BadRequestException)

    const isProduction = process.env.NODE_ENV === 'production';
    const stack = exception instanceof Error && !isProduction ? exception.stack : undefined;

    const errorDetails =
      typeof message === 'object' && message !== null ? message : { message: String(message) };

    const responseBody: Record<string, any> = Object.assign({}, errorDetails, {
      statusCode: status,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    if (requestId) {
      responseBody.requestId = requestId;
    }
    if (stack) {
      responseBody.stack = stack;
    }

    this.logger.error(
      `[${requestId || 'NO_REQ_ID'}] HTTP ${status} | Path: ${request.url} | Error: ${JSON.stringify(errorDetails)}`,
      stack,
    );

    response.status(status).json(responseBody);
  }
}
