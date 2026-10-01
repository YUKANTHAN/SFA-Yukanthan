import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { isSupabaseConfigured, loginAdmin } from '../lib/supabase';
import { useAdminSession } from '../hooks/useAdminSession';

function BrandPanel() {
  return (
    <div className="relative w-full lg:w-1/2 p-8 lg:p-14 flex flex-col justify-between overflow-hidden bg-primary-container text-on-primary">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-container opacity-25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-tertiary-fixed opacity-15 blur-3xl pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern height="48" id="academic-grid" patternUnits="userSpaceOnUse" width="48">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect fill="url(#academic-grid)" height="100%" width="100%" />
      </svg>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <span className="font-headline-lg text-headline-lg tracking-tight text-white block leading-none">
              EduPulse
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed-dim">
              Institutional Intelligence
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
          <span className="font-label-sm text-label-sm text-surface-bright">Cluster v4.8 Active</span>
        </div>
      </div>

      <div className="relative z-10 my-10 lg:my-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30 backdrop-blur-md text-secondary-fixed font-label-md text-label-md">
          <Icon name="verified_user" size={16} />
          Provost &amp; Executive Analytics Terminal
        </div>
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white font-bold leading-tight max-w-xl">
          Empowering Academic Leadership with Real-Time Student Sentiment.
        </h1>
        <p className="font-body-lg text-body-lg text-inverse-primary max-w-lg">
          Synthesise qualitative cohort feedback, isolate pedagogical roadblocks and track
          cross-campus institutional alignment in minutes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-surface-container-highest/10 backdrop-blur-md shadow-e2 flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" fill="none" r="14" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                <circle cx="18" cy="18" fill="none" r="14" stroke="var(--color-tertiary-fixed)" strokeDasharray="63.3 100" strokeWidth="3.8" />
                <circle cx="18" cy="18" fill="none" r="14" stroke="var(--color-surface-dim)" strokeDasharray="15.8 100" strokeDashoffset="-63.3" strokeWidth="3.8" />
                <circle cx="18" cy="18" fill="none" r="14" stroke="var(--color-error)" strokeDasharray="8.8 100" strokeDashoffset="-79.1" strokeWidth="3.8" />
              </svg>
              <span className="absolute font-label-md text-label-md font-bold text-white">72%</span>
            </div>
            <div className="min-w-0">
              <span className="font-label-sm text-label-sm uppercase tracking-wide text-primary-fixed-dim block">
                Sentiment Index
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-headline-sm text-headline-sm text-white">Positive</span>
                <span className="font-label-sm text-label-sm text-tertiary-fixed font-semibold">(+14% SoS)</span>
              </div>
              <span className="font-body-sm text-body-sm text-outline-variant truncate block">4,280 submissions</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-highest/10 backdrop-blur-md shadow-e2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Icon name="school" size={20} className="text-secondary-fixed" />
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed/20 text-tertiary-fixed">
                Verified
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-inverse-on-surface mt-2 italic line-clamp-2">
              “Dean's Office verified: 94% actionable resolution rate on STEM retention.”
            </p>
            <div className="mt-2 flex items-center justify-between font-label-sm text-label-sm text-primary-fixed-dim">
              <span>Fall 2024 Audit</span>
              <span>100% Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 flex flex-wrap items-center gap-4 text-primary-fixed-dim">
        {[
          { icon: 'verified', label: 'FERPA & GDPR Compliant' },
          { icon: 'lock', label: '256-Bit SSL Encrypted' },
          { icon: 'domain_verification', label: 'Institutional SSO Ready' },
        ].map((item, index) => (
          <div key={item.label} className="flex items-center gap-4">
            {index > 0 && <span className="w-1 h-1 rounded-full bg-outline-variant" />}
            <span className="flex items-center gap-1.5">
              <Icon name={item.icon} size={18} className="text-tertiary-fixed" />
              <span className="font-label-sm text-label-sm">{item.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z" fill="#4285F4" />
      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.37 7.36 24 12 24z" fill="#34A853" />
      <path d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.41l4.04-3.13z" fill="#FBBC05" />
      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.63 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z" fill="#EA4335" />
    </svg>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { refresh } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;

    setError('');
    setBusy(true);
    setStatus('Verifying institutional credentials…');

    try {
      await loginAdmin(email.trim(), password);
      setStatus('Credentials verified. Opening your workspace…');
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setStatus(null);
      setError(err.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@college.edu');
    setPassword('admin123');
  };

  return (
    <div className="w-full min-h-screen bg-surface-container-lowest flex items-center justify-center p-margin">
      <div className="w-full max-w-[1440px] rounded-xl shadow-e4 overflow-hidden flex flex-col lg:flex-row bg-surface-container-lowest">
        <BrandPanel />

        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-8">
            <span className="overline text-outline">Academic Portal Access</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Gateway: Active</span>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto my-auto">
            <div className="mb-8">
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface font-semibold tracking-tight">
                Admin &amp; Faculty Portal Sign In
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Access institutional analytics, feedback streams and departmental reports.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div className="mb-6 p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <Icon name="info" size={18} className="text-secondary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Running in demo mode. Use{' '}
                    <button
                      type="button"
                      onClick={fillDemo}
                      className="text-secondary font-semibold hover:underline"
                    >
                      admin@college.edu / admin123
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button type="button" disabled className="w-full h-11 px-4 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-center gap-3 shadow-e1 opacity-70 cursor-not-allowed">
                <Icon name="shield_person" size={20} className="text-secondary" />
                <span className="font-headline-sm text-headline-sm">Sign in with University SSO</span>
              </button>
              <button type="button" disabled className="w-full h-11 px-4 rounded-lg bg-surface-container-low text-on-surface flex items-center justify-center gap-3 shadow-e1 opacity-70 cursor-not-allowed">
                <GoogleMark />
                <span className="font-headline-sm text-headline-sm">Sign in with Google Workspace</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <div className="w-full h-px bg-surface-container-high" />
              <span className="absolute px-4 bg-surface-container-lowest font-label-sm text-label-sm text-outline uppercase tracking-wider">
                or sign in with credentials
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {error && (
                <div role="alert" className="p-3 rounded-lg bg-error-container text-on-error-container flex items-start gap-2.5">
                  <Icon name="error" size={18} className="shrink-0 mt-0.5" />
                  <span className="font-body-sm text-body-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block font-label-md text-label-md text-on-surface mb-1.5">
                  Institutional Email
                </label>
                <div className="relative rounded-lg shadow-e1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="mail" size={18} className="text-outline" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline-variant font-body-md text-body-md shadow-e1 transition-all focus:outline-none focus:shadow-[0_0_0_3px_rgb(75_65_225/0.15)]"
                    placeholder="e.vance@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="font-label-md text-label-md text-on-surface">
                    Administrative Passcode
                  </label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Reset via Academic IT</span>
                </div>
                <div className="relative rounded-lg shadow-e1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="lock" size={18} className="text-outline" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline-variant font-body-md text-body-md shadow-e1 transition-all focus:outline-none focus:shadow-[0_0_0_3px_rgb(75_65_225/0.15)]"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-container-low accent-secondary cursor-pointer focus:ring-0"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Remember this device for 30 days
                  </span>
                </label>
              </div>

              <button type="submit" disabled={busy} className="btn-primary w-full mt-2 shadow-e2">
                {status ? 'Authenticating…' : 'Sign In to Dashboard'}
                <Icon name="arrow_forward" size={18} />
              </button>

              {status && (
                <div className="p-3 rounded-lg bg-surface-container flex items-center gap-2.5" role="status" aria-live="polite">
                  <Icon name="progress_activity" size={18} className="text-secondary animate-spin" />
                  <span className="font-body-sm text-body-sm text-on-surface">{status}</span>
                </div>
              )}
            </form>
          </div>

          <div className="pt-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-outline">
            <p className="font-body-sm text-body-sm">
              Need portal access or role delegation?{' '}
              <Link to="/" className="text-secondary font-medium hover:underline">
                Academic IT Helpdesk
              </Link>
            </p>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Auth Node #104-NA</span>
          </div>
        </div>
      </div>
    </div>
  );
}