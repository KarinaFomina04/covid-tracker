import { getJson } from './statistics';

const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 32;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface PendingRequest {
  controller: AbortController;
  promise: Promise<unknown>;
  subscribers: number;
}

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, PendingRequest>();

export function peekResource<T>(path: string): T | null {
  const entry = cache.get(path);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(path);
    return null;
  }
  // Move recently used entries to the end of the bounded cache.
  cache.delete(path);
  cache.set(path, entry);
  return entry.data as T;
}

function remember(path: string, data: unknown): void {
  cache.delete(path);
  cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value as string;
    cache.delete(oldest);
  }
}

function cancelled(): Error {
  return new Error('Request cancelled');
}

/** Multiple readers share one fetch; cancelling one reader does not cancel the others. */
export function loadResource<T>(path: string, signal?: AbortSignal, force = false): Promise<T> {
  if (signal?.aborted) return Promise.reject(cancelled());

  const cached = force ? null : peekResource<T>(path);
  if (cached !== null) return Promise.resolve(cached);

  let request = pending.get(path);
  if (!request) {
    const controller = new AbortController();
    const promise = getJson<T>(path, controller.signal).then((data) => {
      if (!controller.signal.aborted) remember(path, data);
      return data;
    });
    request = { controller, promise, subscribers: 0 };
    pending.set(path, request);
    void promise.then(
      () => { if (pending.get(path) === request) pending.delete(path); },
      () => { if (pending.get(path) === request) pending.delete(path); },
    );
  }

  const activeRequest = request;
  activeRequest.subscribers += 1;
  return new Promise<T>((resolve, reject) => {
    let active = true;
    const release = () => {
      if (!active) return;
      active = false;
      signal?.removeEventListener('abort', onAbort);
      activeRequest.subscribers -= 1;
      if (activeRequest.subscribers === 0 && pending.get(path) === activeRequest) {
        pending.delete(path);
        activeRequest.controller.abort();
      }
    };
    const onAbort = () => {
      release();
      reject(cancelled());
    };
    signal?.addEventListener('abort', onAbort);
    activeRequest.promise.then(
      (data) => { if (active) { release(); resolve(data as T); } },
      (error) => { if (active) { release(); reject(error); } },
    );
  });
}

export function clearResourceCache(): void {
  cache.clear();
  pending.forEach((request) => request.controller.abort());
  pending.clear();
}
