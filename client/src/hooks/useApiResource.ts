import { useEffect, useState } from 'react';
import { getJson } from '../api/statistics';

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiResource<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    getJson<T>(path, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) {
          setState({ data: null, loading: false, error: error.message });
        }
      });

    return () => controller.abort();
  }, [path, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
