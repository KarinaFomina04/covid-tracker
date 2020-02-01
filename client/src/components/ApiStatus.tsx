import { useEffect, useState } from 'react';

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
    let active = true;

    fetch('/api/v1/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        return response.json() as Promise<HealthResponse>;
      })
      .then((result) => {
        if (active) {
          setStatus(result.status === 'ok' ? 'connected' : 'unavailable');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('unavailable');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <span className={`api-status api-status--${status}`} role="status" aria-live="polite">
      <span className="api-status__indicator" aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
