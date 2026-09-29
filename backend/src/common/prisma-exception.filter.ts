import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected database error occurred.';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') ?? 'field';
        message = `Unique constraint failed on: ${target}`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Requested record was not found.';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violation.';
        break;
      default:
        this.logger.error(`Prisma error [${exception.code}]: ${exception.message}`, exception.stack);
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      errorCode: exception.code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
