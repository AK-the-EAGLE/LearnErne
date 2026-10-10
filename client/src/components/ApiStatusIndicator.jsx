import { useEffect, useState } from 'react';
import { checkBackendHealth } from '../lib/api';

export default function ApiStatusIndicator() {
  const [healthState, setHealthState] = useState({
    loading: true,
    available: false,
    databaseReady: false,
    message: 'Checking API status…',
  });

  useEffect(() => {
    let isMounted = true;

    async function evaluateHealth() {
      try {
        const res = await checkBackendHealth();
        if (!isMounted) return;

        if (res.available && res.data) {
          const isDbReady = Boolean(res.data.database?.isReady);
          setHealthState({
            loading: false,
            available: true,
            databaseReady: isDbReady,
            message: isDbReady ? 'API & Database ready' : 'API ready (Database degraded)',
          });
        } else {
          setHealthState({
            loading: false,
            available: false,
            databaseReady: false,
            message: 'API offline',
          });
        }
      } catch {
        if (!isMounted) return;
        setHealthState({
          loading: false,
          available: false,
          databaseReady: false,
          message: 'API offline',
        });
      }
    }

    evaluateHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const badgeClass = healthState.loading
    ? 'api-status-loading'
    : healthState.available && healthState.databaseReady
    ? 'api-status-online'
    : healthState.available
    ? 'api-status-degraded'
    : 'api-status-offline';

  return (
    <div
      className={`api-status-pill ${badgeClass}`}
      role="status"
      aria-live="polite"
      title={`Backend Status: ${healthState.message}`}
    >
      <span className="api-status-dot" aria-hidden="true" />
      <span className="api-status-text">{healthState.message}</span>
    </div>
  );
}
