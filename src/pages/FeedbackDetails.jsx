import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import FeedbackTable from '../components/FeedbackTable';
import SentimentDonut from '../components/SentimentDonut';
import { useAdminSession } from '../hooks/useAdminSession';
import { fetchFeedbackList, fetchFeedbackThemes } from '../lib/api';
import { attachThemes, downloadText, filterFeedback, optionsFrom, summarize, toCsv } from '../lib/analytics';
import { CATEGORIES, SENTIMENT, SENTIMENT_KEYS } from '../lib/design';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
const RATING_OPTIONS = [5, 4, 3, 2, 1];

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="overline text-on-surface-variant">{label}</span>
      <div className="relative">
        {children}
        {typeof children !== 'string' && children.type !== 'textarea' && (
          <Icon name="expand_more" size={20} className="select-chevron" />
        )}
      </div>
    </label>
  );
}

function Spinner() {
  return (
    <div className="py-space-xl flex flex-col items-center gap-space-md text-on-surface-variant">
      <Icon name="progress_activity" size={40} className="animate-spin" />
      <p className="font-body-md text-body-md">Loading corpus…</p>
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
            Individual student submissions are restricted to authenticated faculty administrators.
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

function DetailPanel({ row, onClose }) {
  const sentiment = SENTIMENT[row.sentiment_label] || SENTIMENT.neutral;
  const praise = row.praise || [];
  const issue = row.issue || [];

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Prevent the page behind the drawer from scrolling while it is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close detail panel"
        onClick={onClose}
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] animate-fade-in"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Response detail"
        className="relative w-full max-w-lg bg-surface-container-lowest h-full overflow-y-auto shadow-e4 animate-slide-up flex flex-col"
      >
        <header className="sticky top-0 z-10 bg-surface-container-lowest px-space-lg py-space-md border-b border-outline-variant flex items-start justify-between gap-space-md">
          <div className="min-w-0">
            <span className="overline text-on-surface-variant">Response Detail</span>
            <h2 className="font-headline-md text-headline-md text-on-surface truncate">
              {row.course_name || 'Untitled course'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost shrink-0 px-space-sm" aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="p-space-lg space-y-space-lg flex-1">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className={`chip ${sentiment.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
              {sentiment.label}
            </span>
            <span className="tag bg-surface-container text-on-surface-variant">{row.category}</span>
            <span className="tag bg-surface-container text-on-surface-variant">
              {row.created_at ? DATE_FMT.format(new Date(row.created_at)) : '—'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-md">
              <span className="overline text-on-surface-variant">Rating</span>
              <p className="font-metric-lg text-metric-lg text-on-surface mt-1">
                {row.rating}
                <span className="text-on-surface-variant">/5</span>
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md">
              <span className="overline text-on-surface-variant">Respondent</span>
              <p className="font-headline-sm text-headline-sm text-on-surface mt-1 flex items-center gap-1.5">
                {row.is_anonymous ? (
                  <>
                    <Icon name="incognito" size={16} className="text-outline" />
                    Anonymous
                  </>
                ) : (
                  row.student_name || '—'
                )}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md col-span-2">
              <span className="overline text-on-surface-variant">Faculty &amp; Department</span>
              <p className="font-headline-sm text-headline-sm text-on-surface mt-1">{row.faculty_name || '—'}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{row.department || '—'}</p>
            </div>
          </div>

          <div>
            <span className="overline text-on-surface-variant">Student Comment</span>
            <blockquote className="mt-1.5 p-space-md bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface leading-relaxed">
              {row.comment || <span className="text-on-surface-variant italic">No comment provided.</span>}
            </blockquote>
          </div>

          {praise.length > 0 && (
            <div>
              <span className="overline text-on-surface-variant">Praise Themes</span>
              <div className="flex flex-wrap gap-space-sm mt-1.5">
                {praise.map((theme) => (
                  <span key={theme} className="chip chip-positive">
                    <Icon name="check_circle" size={14} />
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {issue.length > 0 && (
            <div>
              <span className="overline text-on-surface-variant">Issue Themes</span>
              <div className="flex flex-wrap gap-space-sm mt-1.5">
                {issue.map((theme) => (
                  <span key={theme} className="chip chip-negative">
                    <Icon name="report_problem" size={14} />
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function FeedbackDetails() {
  const { isAdmin, loading: sessionLoading, error: sessionError } = useAdminSession();

  const [feedback, setFeedback] = useState([]);
  const [themes, setThemes] = useState([]);
  const [degraded, setDegraded] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('all');
  const [category, setCategory] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const [rating, setRating] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listResult, themeResult] = await Promise.all([fetchFeedbackList(), fetchFeedbackThemes()]);

      setFeedback(listResult?.items ?? []);
      setThemes(themeResult?.items ?? []);
      setDegraded(Boolean(listResult?.degraded || themeResult?.degraded));
      setNotice(listResult?.notice || themeResult?.notice || null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not load the feedback corpus.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const enriched = useMemo(() => attachThemes(feedback, themes), [feedback, themes]);

  const courseOptions = useMemo(() => optionsFrom(enriched, 'course_name'), [enriched]);
  const filtered = useMemo(
    () => filterFeedback(enriched, { search, course, category, sentiment, rating }),
    [enriched, search, course, category, sentiment, rating]
  );
  const stats = useMemo(() => summarize(filtered), [filtered]);

  const hasFilters =
    search !== '' || course !== 'all' || category !== 'all' || sentiment !== 'all' || rating !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCourse('all');
    setCategory('all');
    setSentiment('all');
    setRating('all');
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`edupulse-feedback-${stamp}.csv`, toCsv(filtered));
  };

  if (sessionLoading) return <Spinner />;
  if (!isAdmin) return <AccessDenied error={sessionError} />;

  return (
    <div className="space-y-gutter py-gutter animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <span className="overline text-secondary">Response Audit</span>
          <h1 className="font-headline-xl-mobile sm:font-headline-xl text-headline-xl text-on-surface mt-1">
            Feedback Sentiment Inspector
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Filter the corpus, read the verbatim evidence, and export the current selection.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button type="button" className="btn-secondary" onClick={load} disabled={loading}>
            <Icon name="refresh" size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button type="button" className="btn-primary" onClick={exportCsv} disabled={filtered.length === 0}>
            <Icon name="download" size={18} />
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div
          className="flex items-start gap-space-sm p-space-md rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm"
          role="alert"
        >
          <Icon name="error" size={18} className="shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {!error && degraded && notice && (
        <div
          className="flex items-start gap-space-sm p-space-md rounded-xl bg-secondary-container/15 text-on-secondary-container font-body-sm text-body-sm"
          role="status"
        >
          <Icon name="cloud_off" size={18} className="shrink-0 mt-px" />
          <span>{notice}</span>
        </div>
      )}

      <section className="card p-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-space-md">
          <div className="md:col-span-2 xl:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="inspector-search" className="overline text-on-surface-variant">
              Search Corpus
            </label>
            <div className="relative">
              <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                id="inspector-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Comment, course, faculty…"
                className="field pl-9"
              />
            </div>
          </div>

          <Field label="Course">
            <select className="field" value={course} onChange={(event) => setCourse(event.target.value)}>
              <option value="all">All courses</option>
              {courseOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Category">
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sentiment">
            <select className="field" value={sentiment} onChange={(event) => setSentiment(event.target.value)}>
              <option value="all">All sentiments</option>
              {SENTIMENT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SENTIMENT[key].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Rating">
            <select className="field" value={rating} onChange={(event) => setRating(event.target.value)}>
              <option value="all">All ratings</option>
              {RATING_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} star{value > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-space-sm mt-space-md pt-space-md border-t border-outline-variant flex-wrap">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">{filtered.length.toLocaleString('en-US')}</span> of{' '}
            {enriched.length.toLocaleString('en-US')} submissions
            {hasFilters && ' after filtering'}
          </p>
          {hasFilters && (
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              <Icon name="filter_alt_off" size={18} />
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <div className="xl:col-span-8 card p-space-lg">
          <span className="overline text-on-surface-variant">Master Table</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5 mb-space-md">
            Individual Submissions
          </h2>
          <FeedbackTable feedback={filtered} onSelect={setSelected} selectedId={selected?.id} />
        </div>

        <div className="xl:col-span-4 space-y-gutter">
          <SentimentDonut
            counts={stats.sentimentCounts}
            total={stats.total}
            precision={degraded ? 'Demo' : 'Live'}
          />
        </div>
      </section>

      {selected && <DetailPanel row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}