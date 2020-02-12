import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

function exceptionDetails(exception: HttpException): { message: string | string[]; error: string } {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { message: response, error: exception.name };
  }
  if (response && typeof response === 'object') {
    const payload = response as Record<string, unknown>;
    const message = payload.message;
    const error = payload.error;
    return {
      message: typeof message === 'string' ||
        (Array.isArray(message) && message.every((part) => typeof part === 'string'))
        ? message
        : exception.message,
      error: typeof error === 'string' ? error : exception.name,
    };
  }
  return { message: exception.message, error: exception.name };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<{ method: string; url: string }>();
    const response = http.getResponse<{ status: (code: number) => { json: (body: ApiErrorResponse) => void } }>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Do not expose internal exception messages or stack traces to API consumers.
    const details = status >= HttpStatus.INTERNAL_SERVER_ERROR &&
      status !== HttpStatus.SERVICE_UNAVAILABLE
      ? { message: 'Internal server error', error: 'Internal Server Error' }
      : exception instanceof HttpException
      ? exceptionDetails(exception)
      : { message: 'Internal server error', error: 'Internal Server Error' };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const reason = exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.error(`${request.method} ${request.url} (${status}): ${reason}`);
    }

    response.status(status).json({
      statusCode: status,
      message: details.message,
      error: details.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
