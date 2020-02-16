import { useEffect, useState } from 'react';
import { getJson } from '../api/statistics';

type ConnectionStatus = 'connecting' | 'connected' | 'unavailable';

interface HealthResponse {
  status: string;
  service: string;
}

const labels: Record<ConnectionStatus, string> = {
  connecting: 'Connecting to API',
  connected: 'API connected',
  unavailable: 'API unavailable',
};

export default function ApiStatus(): JSX.Element {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const controller = new AbortController();

    getJson<HealthResponse>('/health', controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setStatus(result.status === 'ok' ? 'connected' : 'unavailable');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });

    return () => controller.abort();
  }, []);

  return (
    <span className={`api-status api-status--${status}`} role="status" aria-live="polite">
      <span className="api-status__indicator" aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
