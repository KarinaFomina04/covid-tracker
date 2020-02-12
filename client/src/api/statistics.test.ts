import { ApiRequestError, getJson } from './statistics';

describe('statistics API client', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns parsed JSON for successful responses', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ totalCases: 100 }),
    });
    await expect(getJson<{ totalCases: number }>('/summary')).resolves.toEqual({ totalCases: 100 });
    expect(window.fetch).toHaveBeenCalledWith('/api/v1/summary', expect.objectContaining({
      signal: expect.any(Object),
    }));
  });

  it('reports availability errors without exposing server internals', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(getJson('/summary')).rejects.toMatchObject({
      status: 503,
      message: 'Statistics are currently unavailable. Please try again later.',
    });
  });

  it('handles network failures with a readable error', async () => {
    window.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(getJson('/countries')).rejects.toMatchObject({
      message: 'Unable to connect to the server. Please check your connection.',
    });
  });

  it('handles invalid JSON responses', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    });
    await expect(getJson('/summary')).rejects.toMatchObject({
      status: 200,
      message: 'The server returned an invalid response.',
    });
  });

  it('times out stalled requests', async () => {
    window.fetch = jest.fn().mockImplementation((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
    );
    const request = getJson('/summary');
    jest.advanceTimersByTime(20000);
    await expect(request).rejects.toMatchObject({
      message: 'The request timed out. Please try again.',
    });
  });

  it('propagates cancellation from the page instead of reporting a network failure', async () => {
    const controller = new AbortController();
    window.fetch = jest.fn().mockImplementation((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
      }),
    );
    const request = getJson('/countries', controller.signal);
    controller.abort();
    await expect(request).rejects.not.toBeInstanceOf(ApiRequestError);
  });
});
