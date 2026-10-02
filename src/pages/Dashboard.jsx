import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import StatCard from '../components/StatCard';
import RatingDistribution from '../components/RatingDistribution';
import SentimentDonut from '../components/SentimentDonut';
import SentimentTrend from '../components/SentimentTrend';
import CategoryBars from '../components/CategoryBars';
import TopInsights from '../components/TopInsights';
import FeedbackTable from '../components/FeedbackTable';
import { useAdminSession } from '../hooks/useAdminSession';
import {
  fetchFeedbackList,
  fetchFeedbackThemes,
  getCorpusVersion,
  subscribeToCorpusChanges,
} from '../lib/api';
import { attachThemes, summarize } from '../lib/analytics';
import { BRAND } from '../lib/design';

const PREVIEW_ROWS = 6;

/** Background refetch cadence while the tab is visible. */
const POLL_INTERVAL_MS = 20_000;

function Banner({ tone, icon, children }) {
  const tones = {
    warn: 'bg-secondary-container/15 text-on-secondary-container',
    error: 'bg-error-container text-on-error-container',
  };

  return (
    <div className={`flex items-start gap-space-sm p-space-md rounded-xl font-body-sm text-body-sm ${tones[tone]}`} role="status">
      <Icon name={icon} size={18} className="shrink-0 mt-px" />
      <span>{children}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-space-xl flex flex-col items-center gap-space-md text-on-surface-variant">
      <Icon name="progress_activity" size={40} className="animate-spin" />
      <p className="font-body-md text-body-md">Computing institutional aggregates…</p>
    </div>
  );
}

function AccessDenied({ error }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto py-space-xl text-center space-y-space-md">
      <span className="inline-flex p-space-lg rounded-2xl bg-error-container text-on-error-container">
        <Icon name="shield_lock" size={32} />
      </span>
      <h2 className="font-headline-md text-headline-md text-on-surface">
        {error ? 'Analytics API unreachable' : 'Admin clearance required'}
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {error || (
          <>
            This corpus contains identifiable student submissions and is restricted to authenticated faculty
            administrators.
          </>
        )}
      </p>
      {error ? (
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          <Icon name="refresh" size={18} />
          Retry
        </button>
      ) : (
        <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
          <Icon name="login" size={18} />
          Go to admin login
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, loading: sessionLoading, error: sessionError } = useAdminSession();

  const [feedback, setFeedback] = useState([]);
  const [themes, setThemes] = useState([]);
  const [degraded, setDegraded] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedVersion, setLoadedVersion] = useState(() => getCorpusVersion());

  const load = useCallback(async ({ silent = false } = {}) => {
    // A background refresh must not blank the charts the operator is reading.
    if (!silent) setLoading(true);

    try {
      const [listResult, themeResult] = await Promise.all([fetchFeedbackList(), fetchFeedbackThemes()]);

      // Both readers return the envelope declared by the API. Anything else is
      // a contract break and should surface here rather than as quiet zeros.
      setFeedback(listResult?.items ?? []);
      setThemes(themeResult?.items ?? []);
      setDegraded(Boolean(listResult?.degraded || themeResult?.degraded));
      setNotice(listResult?.notice || themeResult?.notice || null);
      setError(null);
      setLoadedVersion(getCorpusVersion());
    } catch (err) {
      setError(err.message || 'Could not load the feedback corpus.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    load();
    return undefined;
  }, [isAdmin, load]);

  // Keep the view honest without the operator reaching for the refresh button:
  // a submission in another tab, a return to the tab, and a slow poll all
  // converge on the same refetch.
  useEffect(() => {
    if (!isAdmin) return undefined;

    const refresh = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };

    const unsubscribe = subscribeToCorpusChanges(() => {
      if (getCorpusVersion() !== loadedVersion) load({ silent: true });
    });

    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [isAdmin, load, loadedVersion]);

  const enriched = useMemo(() => attachThemes(feedback, themes), [feedback, themes]);
  const stats = useMemo(() => summarize(enriched), [enriched]);

  if (sessionLoading) return <LoadingState />;
  if (!isAdmin) return <AccessDenied error={sessionError} />;

  return (
    <div className="space-y-gutter py-gutter animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <span className="overline text-secondary">Live Intelligence Feed</span>
          <h1 className="font-headline-xl-mobile sm:font-headline-xl text-headline-xl text-on-surface mt-1">
            Institutional Sentiment Overview
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Aggregated student experience signals across {stats.total.toLocaleString('en-US')} verified submissions.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button type="button" className="btn-secondary" onClick={() => load()} disabled={loading}>
            <Icon name="refresh" size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link to="/details" className="btn-primary">
            Open inspector
            <Icon name="arrow_forward" size={18} />
          </Link>
        </div>
      </header>

      {error && (
        <Banner tone="error" icon="error">
          {error} Showing the last data this screen managed to load.
        </Banner>
      )}

      {!error && degraded && notice && (
        <Banner tone="warn" icon="cloud_off">
          {notice}
        </Banner>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <StatCard
          label="Total Responses"
          value={stats.total.toLocaleString('en-US')}
          tone="primary"
          sub={`${stats.ratedCount.toLocaleString('en-US')} carrying a 1–5 rating`}
        />
        <StatCard
          label="Average Rating"
          value={stats.avgRating.toFixed(1)}
          suffix="/ 5.0"
          tone="amber"
          progress={(stats.avgRating / 5) * 100}
          sub="Campus-wide weighted mean"
        />
        <StatCard
          label="Positive Sentiment"
          value={`${stats.positivePct.toFixed(1)}%`}
          tone="tertiary"
          progress={stats.positivePct}
          sub={`${stats.sentimentCounts.positive.toLocaleString('en-US')} constructive responses`}
        />
        <StatCard
          label="Actionable Issues"
          value={stats.issueCount.toLocaleString('en-US')}
          tone="error"
          sub={`${((stats.issueCount / (stats.total || 1)) * 100).toFixed(1)}% of the corpus requires follow-up`}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <div className="xl:col-span-5">
          <RatingDistribution counts={stats.ratingCounts} total={stats.total} />
        </div>
        <div className="xl:col-span-7">
          <SentimentDonut counts={stats.sentimentCounts} total={stats.total} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        <SentimentTrend feedback={enriched} />
        <CategoryBars stats={stats.categoryStats} />
      </section>

      <TopInsights feedback={enriched} themes={themes} />

      <section className="card p-space-lg">
        <div className="flex items-center justify-between gap-space-md mb-space-md flex-wrap">
          <div>
            <span className="overline text-on-surface-variant">Latest Submissions</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
              Most recent student feedback
            </h2>
          </div>
          <Link to="/details" className="btn-ghost">
            Inspect all
            <Icon name="arrow_forward" size={18} />
          </Link>
        </div>

        <FeedbackTable feedback={enriched} maxRows={PREVIEW_ROWS} onSelect={() => {}} />
      </section>

      <footer className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between gap-space-sm pt-space-sm flex-wrap">
        <span>
          {BRAND.name} · {BRAND.tagline}
        </span>
        <span>Sentiment labels are lexicon-derived. Treat as directional, not diagnostic.</span>
      </footer>
    </div>
  );
}