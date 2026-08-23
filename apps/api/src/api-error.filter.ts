import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const details =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : null;
    const validationError = status === HttpStatus.BAD_REQUEST && Array.isArray(details);
    const code = validationError
      ? 'VALIDATION_ERROR'
      : typeof exceptionResponse === 'object' &&
          exceptionResponse !== null &&
          'code' in exceptionResponse
        ? String(exceptionResponse.code)
        : status === 500
          ? 'INTERNAL_ERROR'
          : 'REQUEST_FAILED';
    const message = validationError
      ? 'البيانات المدخلة غير صحيحة'
      : typeof exceptionResponse === 'object' &&
          exceptionResponse !== null &&
          'message' in exceptionResponse &&
          typeof exceptionResponse.message === 'string'
        ? exceptionResponse.message
        : status === 500
          ? 'حدث خطأ داخلي'
          : 'تعذر تنفيذ الطلب';

    response.status(status).json({
      statusCode: status,
      code,
      message,
      details: Array.isArray(details) ? { messages: details } : null,
    });
  }
}
