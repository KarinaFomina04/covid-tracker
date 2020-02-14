import { useEffect, useState } from 'react';
import { loadResource, peekResource } from '../api/resource-cache';

interface ResourceState<T> {
  path: string;
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiResource<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResourceState<T>>(() => {
    const cached = peekResource<T>(path);
    return { path, data: cached, loading: cached === null, error: null };
  });

  useEffect(() => {
    const controller = new AbortController();
    const cached = attempt === 0 ? peekResource<T>(path) : null;
    if (cached !== null) {
      setState({ path, data: cached, loading: false, error: null });
      return () => controller.abort();
    }

    setState({ path, data: null, loading: true, error: null });
    loadResource<T>(path, controller.signal, attempt > 0)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ path, data, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) {
          setState({ path, data: null, loading: false, error: error.message });
        }
      });

    return () => controller.abort();
  }, [path, attempt]);

  // Never display data from the previous route while a new route is loading.
  const visible = state.path === path
    ? state
    : { path, data: null, loading: true, error: null };
  return { data: visible.data, loading: visible.loading, error: visible.error,
    retry: () => setAttempt((value) => value + 1) };
}
