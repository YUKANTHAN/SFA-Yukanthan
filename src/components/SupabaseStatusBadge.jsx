import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, CheckCircle2, AlertTriangle, HelpCircle, X, ExternalLink } from 'lucide-react';

export default function SupabaseStatusBadge() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className={`badge cursor-pointer transition-all hover:opacity-90 ${
          isSupabaseConfigured 
            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' 
            : 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
        }`}
        style={{ cursor: 'pointer' }}
        title="Click for Supabase Database status & setup instructions"
      >
        <Database size={13} className="inline mr-1" />
        {isSupabaseConfigured ? 'Supabase Live' : 'Demo / Local Mode'}
        {isSupabaseConfigured ? (
          <CheckCircle2 size={12} className="ml-1 text-emerald-400" />
        ) : (
          <AlertTriangle size={12} className="ml-1 text-amber-400" />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-6 relative border border-slate-700 shadow-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Database Connection Status</h3>
                <p className="text-sm text-slate-400">
                  {isSupabaseConfigured 
                    ? 'Connected to your Supabase PostgreSQL Database' 
                    : 'Running in Standalone Local Demo Mode'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300 my-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {isSupabaseConfigured ? (
                <div className="space-y-2">
                  <p className="text-emerald-300 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} /> Live database connection active!
                  </p>
                  <p className="text-xs text-slate-400">
                    Feedback insertions, PostgreSQL sentiment triggers, and admin authentication are operating directly on your Supabase backend.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-amber-300 font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} /> Currently utilizing client-side mock store
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    You can fully test all features (Feedback submission, sentiment engine, top praises/issues, admin login with <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">admin@college.edu</code> / <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">admin123</code>).
                  </p>

                  <div className="border-t border-slate-800 pt-3">
                    <p className="font-semibold text-white mb-1">To connect live Supabase:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-400">
                      <li>Create a project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">Supabase.com <ExternalLink size={10} /></a></li>
                      <li>Run the queries in <code className="text-indigo-300">supabase_schema.sql</code> inside SQL Editor</li>
                      <li>Copy <code className="text-indigo-300">VITE_SUPABASE_URL</code> & <code className="text-indigo-300">VITE_SUPABASE_ANON_KEY</code> into <code className="text-indigo-300">.env.local</code></li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
