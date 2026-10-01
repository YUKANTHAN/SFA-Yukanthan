import { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import Icon from './Icon';

/**
 * Surfaces whether the app is running against a real Supabase project or the
 * built-in demo corpus, and carries the setup instructions that were
 * previously buried in this component.
 */
export default function SupabaseStatusBadge() {
  const [open, setOpen] = useState(false);

  const configured = isSupabaseConfigured;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold transition-colors ${
          configured
            ? 'bg-tertiary-fixed text-on-tertiary-fixed hover:brightness-95'
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
        }`}
        aria-haspopup="dialog"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-on-tertiary-container' : 'bg-amber-500'}`} />
        <span className="hidden lg:inline">{configured ? 'Supabase Live' : 'Demo Mode'}</span>
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
            aria-label="Data source"
            className="card w-full max-w-lg rounded-2xl p-space-xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-space-md">
              <div>
                <span className="overline text-secondary">Data Source</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                  {configured ? 'Connected to Supabase' : 'Running on the demo corpus'}
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

            {!configured && (
              <ol className="flex flex-col gap-space-sm mt-space-lg text-body-md text-body-md text-on-surface-variant">
                {[
                  'Create a Supabase project and copy the project URL and anon key.',
                  'Run supabase_schema.sql in the Supabase SQL Editor to create tables, RLS policies and the sentiment trigger.',
                  'Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
                  'Restart the dev server.',
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
              Sentiment and theme extraction run as a PL/pgSQL trigger on the database. Without a
              configured project they run in the browser against the same rules.
            </p>
          </div>
        </div>
      )}
    </>
  );
}