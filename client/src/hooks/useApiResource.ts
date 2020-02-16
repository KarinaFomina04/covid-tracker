import { useEffect, useState } from 'react';
import { loadResource, peekResource } from '../api/resource-cache';

interface ResourceState<T> {
  path: string;
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiResource<T>(path: string, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResourceState<T>>(() => {
    const cached = enabled ? peekResource<T>(path) : null;
    return { path, data: cached, loading: enabled && cached === null, error: null };
  });

  useEffect(() => {
    if (!enabled) {
      setState({ path, data: null, loading: false, error: null });
      return;
    }
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
  }, [path, attempt, enabled]);

  // Never display data from the previous route while a new route is loading.
  const visible = !enabled
    ? { path, data: null, loading: false, error: null }
    : state.path === path
      ? state
      : { path, data: null, loading: true, error: null };
  return { data: visible.data, loading: visible.loading, error: visible.error,
    retry: () => setAttempt((value) => value + 1) };
}
