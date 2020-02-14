import { getJson } from './statistics';
import { clearResourceCache, loadResource, peekResource } from './resource-cache';

jest.mock('./statistics', () => ({ getJson: jest.fn() }));
const request = getJson as jest.Mock;

beforeEach(() => {
  clearResourceCache();
  request.mockReset();
});

test('reuses a successful response until the cache expires', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    request.mockResolvedValueOnce({ cases: 10 }).mockResolvedValueOnce({ cases: 12 });
    await expect(loadResource('/summary')).resolves.toEqual({ cases: 10 });
    expect(peekResource('/summary')).toEqual({ cases: 10 });
    await expect(loadResource('/summary')).resolves.toEqual({ cases: 10 });
    expect(request).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(61001);
    await expect(loadResource('/summary')).resolves.toEqual({ cases: 12 });
    expect(request).toHaveBeenCalledTimes(2);
  } finally {
    clock.mockRestore();
  }
});

test('deduplicates simultaneous requests and preserves independent cancellation', async () => {
  let resolve!: (data: { cases: number }) => void;
  request.mockReturnValue(new Promise((done) => { resolve = done; }));
  const firstController = new AbortController();
  const secondController = new AbortController();
  const first = loadResource('/map', firstController.signal);
  const second = loadResource('/map', secondController.signal);
  expect(request).toHaveBeenCalledTimes(1);
  const transportSignal = request.mock.calls[0][1] as AbortSignal;
  firstController.abort();
  await expect(first).rejects.toThrow('Request cancelled');
  expect(transportSignal.aborted).toBe(false);
  resolve({ cases: 30 });
  await expect(second).resolves.toEqual({ cases: 30 });
  expect(peekResource('/map')).toEqual({ cases: 30 });
});

test('aborts the underlying request after the last subscriber leaves', async () => {
  request.mockReturnValue(new Promise(() => undefined));
  const firstController = new AbortController();
  const secondController = new AbortController();
  const first = loadResource('/map', firstController.signal);
  const second = loadResource('/map', secondController.signal);
  const transportSignal = request.mock.calls[0][1] as AbortSignal;
  firstController.abort();
  await expect(first).rejects.toThrow('Request cancelled');
  expect(transportSignal.aborted).toBe(false);
  secondController.abort();
  await expect(second).rejects.toThrow('Request cancelled');
  expect(transportSignal.aborted).toBe(true);
});

test('retries failed requests and supports explicitly refreshing cached results', async () => {
  request.mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ cases: 10 })
    .mockResolvedValueOnce({ cases: 11 });
  await expect(loadResource('/summary')).rejects.toThrow('Offline');
  expect(peekResource('/summary')).toBeNull();
  await expect(loadResource('/summary')).resolves.toEqual({ cases: 10 });
  await expect(loadResource('/summary', undefined, true)).resolves.toEqual({ cases: 11 });
  expect(request).toHaveBeenCalledTimes(3);
});

test('limits cached URLs to avoid retaining every search query', async () => {
  request.mockImplementation(async (path: string) => ({ path }));
  for (let index = 0; index < 33; index += 1) {
    await loadResource(`/countries?search=${index}`);
  }
  expect(peekResource('/countries?search=0')).toBeNull();
  expect(peekResource('/countries?search=32')).toEqual({ path: '/countries?search=32' });
});
