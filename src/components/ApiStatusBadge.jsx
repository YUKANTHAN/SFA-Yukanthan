import { useCallback, useEffect, useState } from 'react';
import { checkHealth } from '../lib/api';
import Icon from './Icon';

const POLL_INTERVAL_MS = 30_000;

/**
 * Reports whether the analytics API and the database behind it are answering.
 *
 * This replaces a badge that only inspected whether Supabase env vars were
 * present in the bundle - which said "Live" even when every request was being
 * rejected, and could never say anything about the API at all. It now asks
 * the API, and says so plainly when the answer is no.
 */
export default function ApiStatusBadge() {
  const [state, setState] = useState({ status: 'checking', database: 'unknown', detail: null });
  const [open, setOpen] = useState(false);

  const probe = useCallback(async () => {
    try {
      setState(await checkHealth());
    } catch (error) {
      setState({ status: 'unreachable', database: 'unknown', detail: error.message });
    }
  }, []);

  useEffect(() => {
    probe();
    const interval = window.setInterval(probe, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [probe]);

  const healthy = state.status === 'ok';

  const tone = healthy
    ? 'bg-tertiary-fixed text-on-tertiary-fixed hover:brightness-95'
    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high';

  const dot = healthy
    ? 'bg-on-tertiary-container'
    : state.status === 'checking'
      ? 'bg-outline animate-pulse'
      : 'bg-amber-500';

  const label = healthy
    ? 'API Live'
    : state.status === 'checking'
      ? 'Checking'
      : state.status === 'degraded'
        ? 'DB Offline'
        : state.status === 'misconfigured'
          ? 'Not Configured'
          : 'API Offline';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${tone}`}
        aria-haspopup="dialog"
        title={state.detail || `Analytics API: ${label}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="hidden lg:inline">{label}</span>
        <Icon name="help" size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-margin"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Data source status"
            className="card w-full max-w-lg rounded-2xl p-space-xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-space-md">
              <div>
                <span className="overline text-secondary">Data Source</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                  {healthy ? 'Connected to the analytics API' : `Analytics API: ${label}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {state.detail && (
              <p className="mt-space-lg p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm">
                {state.detail}
              </p>
            )}

            <dl className="grid grid-cols-2 gap-space-sm mt-space-lg font-body-sm text-body-sm">
              <div className="bg-surface-container-low rounded-lg p-space-sm">
                <dt className="overline text-on-surface-variant">API</dt>
                <dd className="text-on-surface mt-0.5">{label}</dd>
              </div>
              <div className="bg-surface-container-low rounded-lg p-space-sm">
                <dt className="overline text-on-surface-variant">Database</dt>
                <dd className="text-on-surface mt-0.5">{state.database}</dd>
              </div>
            </dl>

            {!healthy && (
              <ol className="flex flex-col gap-space-sm mt-space-lg text-body-md text-body-md text-on-surface-variant">
                {[
                  'Start the backend: cd backend && uvicorn app.main:app --reload --port 8000',
                  'Copy backend/.env.example to backend/.env and set SUPABASE_URL and SUPABASE_ANON_KEY.',
                  'Confirm the Vite dev server is proxying /api (see vite.config.js).',
                  'Run supabase_schema.sql in the Supabase SQL Editor if the tables are missing.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-space-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-surface-container-high text-primary-container font-label-sm text-label-sm flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}

            <p className="text-body-sm text-body-sm text-on-surface-variant mt-space-lg p-space-sm rounded-lg bg-surface-container-low">
              Sentiment scoring and theme extraction run in the Python API and are stored with the
              record. There is no browser-side corpus: if the API cannot answer, the dashboard says so
              rather than showing sample data.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
