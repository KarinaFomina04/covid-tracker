import {
  ArgumentsHost,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/v1/countries?limit=0' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  const filter = new ApiExceptionFilter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves validation messages and returns consistent response metadata', () => {
    filter.catch(new BadRequestException(['limit must not be less than 1']), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      message: ['limit must not be less than 1'],
      path: '/api/v1/countries?limit=0',
      timestamp: expect.any(String),
    }));
  });

  it('keeps service availability errors public', () => {
    filter.catch(new ServiceUnavailableException('Statistics unavailable'), host);
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 503,
      message: 'Statistics unavailable',
    }));
  });

  it('does not disclose internal exception messages', () => {
    filter.catch(new Error('Database credentials are incorrect'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      message: 'Internal server error',
    }));
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('Database credentials');
  });
});
