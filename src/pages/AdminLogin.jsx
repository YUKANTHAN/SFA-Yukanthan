import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, isSupabaseConfigured } from '../lib/supabase';
import { ShieldCheck, Lock, Mail, Key, LogIn, AlertCircle, Info } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 animate-fade-in space-y-6">
      
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Faculty & Admin Portal</h1>
        <p className="text-xs text-slate-400">
          Sign in to access analytics dashboard, sentiment metrics, and CSV reports.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 border-slate-800">
        
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="form-group mb-0">
            <label className="form-label flex items-center gap-1.5 text-xs">
              <Mail size={13} className="text-indigo-400" />
              Admin Email Address
            </label>
            <input
              type="email"
              required
              placeholder="admin@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control text-sm py-2.5"
            />
          </div>

          <div className="form-group mb-0">
            <label className="form-label flex items-center gap-1.5 text-xs">
              <Key size={13} className="text-indigo-400" />
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control text-sm py-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Admin Dashboard
              </>
            )}
          </button>

        </form>

        {/* Demo Mode Quick Auto-fill Box */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
            <Info size={14} />
            {isSupabaseConfigured ? 'Supabase Authentication Active' : 'Demo Credentials Helper'}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {isSupabaseConfigured ? (
              'Sign in using your Supabase Auth admin user account created in your database.'
            ) : (
              'You are running in Standalone Local Demo Mode. Click below to prefill demo admin credentials:'
            )}
          </p>

          {!isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => { setEmail('admin@college.edu'); setPassword('admin123'); }}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">admin@college.edu</div>
                <div className="text-[10px] text-slate-400">Password: <code className="text-indigo-300">admin123</code></div>
              </div>
              <span className="badge badge-positive text-[10px]">Autofill</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
