import { getApiError } from '../api.js';

export default function ApiErrorBanner({ error }) {
  if (!error) return null;

  const message = getApiError(error);
  const isDb = /access denied|database|ECONNREFUSED|disconnected/i.test(message);

  return (
    <div className="api-error-banner">
      <strong>{isDb ? 'Database not connected' : 'Could not load data'}</strong>
      <p>{message}</p>
      {isDb && (
        <p className="api-error-hint">
          Set <code>DB_PASSWORD</code> in <code>backend/.env</code>, then run{' '}
          <code>backend/scripts/setup-db.ps1 -Password "YOUR_PASSWORD"</code> and restart the backend.
        </p>
      )}
    </div>
  );
}
