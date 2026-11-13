import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected database error occurred.';
    let errorCode: string | undefined = undefined;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorCode = exception.code;
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
          message = `Database request error [${exception.code}].`;
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      const lines = (exception.message || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      const informativeLine = lines.find((l: string) =>
        l.includes('Unknown argument') ||
        l.includes('Invalid value') ||
        l.includes('Argument') ||
        l.includes('Provided')
      );
      message = informativeLine ? `Database input validation error: ${informativeLine}` : 'Invalid data format provided to database.';
      this.logger.warn(`Prisma Validation Error on ${request.method} ${request.url}: ${exception.message}`);
    } else {
      this.logger.error(`Database error on ${request.method} ${request.url}: ${exception?.message}`, exception?.stack);
      message = exception?.message || 'Database operation failed.';
    }

    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
