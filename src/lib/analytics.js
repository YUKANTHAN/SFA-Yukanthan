/**
 * Pure aggregation helpers shared by the dashboard and the inspector.
 *
 * Everything here derives from the two reader results ({ items } arrays) so the
 * two surfaces can never disagree about a number, and so a single pass over a
 * large corpus is not repeated per chart.
 */

import { SENTIMENT_KEYS } from './design';

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

/** Total, mean rating, and per-bucket counts for ratings and sentiment. */
export function summarize(feedback) {
  const rows = feedback || [];
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const categoryStats = {};

  let ratingSum = 0;
  let ratingSeen = 0;

  rows.forEach((row) => {
    const rating = num(row.rating);
    if (rating !== null && rating >= 1 && rating <= 5) {
      ratingCounts[rating] += 1;
      ratingSum += rating;
      ratingSeen += 1;
    }

    const label = SENTIMENT_KEYS.includes(row.sentiment_label) ? row.sentiment_label : 'neutral';
    sentimentCounts[label] += 1;

    if (row.category) {
      const stat = categoryStats[row.category] || { total: 0, count: 0 };
      if (rating !== null) {
        stat.total += rating;
        stat.count += 1;
      }
      categoryStats[row.category] = stat;
    }
  });

  const total = rows.length;
  const positivePct = total ? (sentimentCounts.positive / total) * 100 : 0;

  return {
    total,
    ratingCounts,
    sentimentCounts,
    categoryStats,
    avgRating: ratingSeen ? ratingSum / ratingSeen : 0,
    ratedCount: ratingSeen,
    positivePct,
    neutralCount: sentimentCounts.neutral,
    negativeCount: sentimentCounts.negative,
    // "Actionable" means flagged negatively, or carrying at least one issue theme.
    issueCount: sentimentCounts.negative,
    anonymousCount: rows.filter((row) => row.is_anonymous).length,
  };
}

/**
 * Themes ranked by mention count, split into praise and issue.
 * `byFeedbackId` lets the UI attach a verbatim quote to each theme row.
 */
export function tallyThemes(themes) {
  const tally = {};
  const byFeedbackId = new Map();

  (themes || []).forEach((row) => {
    if (!row?.theme) return;
    const key = `${row.theme_type}::${row.theme}`;
    tally[key] = tally[key] || { theme: row.theme, theme_type: row.theme_type, count: 0 };
    tally[key].count += 1;

    if (row.feedback_id != null) {
      if (!byFeedbackId.has(row.feedback_id)) byFeedbackId.set(row.feedback_id, new Set());
      byFeedbackId.get(row.feedback_id).add(row.theme);
    }
  });

  const all = Object.values(tally);
  const rank = (a, b) => b.count - a.count;

  return {
    praise: all.filter((t) => t.theme_type === 'praise').sort(rank),
    issue: all.filter((t) => t.theme_type === 'issue').sort(rank),
    byFeedbackId,
  };
}

/** Feedback rows with a `themes` array of theme names, for evidence lookups. */
export function attachThemes(feedback, themes) {
  const { byFeedbackId } = tallyThemes(themes);
  return (feedback || []).map((row) => ({
    ...row,
    themes: [...(byFeedbackId.get(row.id) || [])],
  }));
}

/** Case-insensitive "does any haystack field contain needle" test. */
function matches(row, needle, fields) {
  if (!needle) return true;
  const target = String(needle).toLowerCase();
  return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(target));
}

export const DEFAULT_FILTERS = {
  search: '',
  course: 'all',
  category: 'all',
  department: 'all',
  sentiment: 'all',
  rating: 'all',
  term: 'all',
};

/**
 * All filters are AND-ed; an empty / 'all' control is skipped so the default
 * filter set is a genuine no-op rather than a filter that hides everything.
 */
export function filterFeedback(feedback, filters = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return (feedback || []).filter((row) =>
    matches(row, f.search, ['comment', 'course_name', 'faculty_name', 'student_name', 'category']) &&
    (f.course === 'all' || row.course_name === f.course) &&
    (f.category === 'all' || row.category === f.category) &&
    (f.department === 'all' || row.department === f.department) &&
    (f.sentiment === 'all' || row.sentiment_label === f.sentiment) &&
    (f.rating === 'all' || String(row.rating) === String(f.rating)) &&
    (f.term === 'all' || row.term === f.term)
  );
}

/** Distinct values present in the data, for populating filter dropdowns. */
export function optionsFrom(rows, field) {
  return [...new Set((rows || []).map((row) => row[field]).filter(Boolean))].sort();
}

const CSV_COLUMNS = [
  ['id', 'Ref'],
  ['created_at', 'Logged'],
  ['student_name', 'Respondent'],
  ['is_anonymous', 'Anonymous'],
  ['department', 'Department'],
  ['course_name', 'Course'],
  ['faculty_name', 'Faculty'],
  ['category', 'Category'],
  ['rating', 'Rating'],
  ['sentiment_label', 'Sentiment'],
  ['comment', 'Comment'],
];

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV of the current filtered rows. Comments can contain quotes, commas and
 * newlines, so every field goes through the RFC 4180 escaping above.
 */
export function toCsv(rows) {
  const header = CSV_COLUMNS.map(([, label]) => escapeCsv(label)).join(',');
  const body = (rows || []).map((row) => CSV_COLUMNS.map(([key]) => escapeCsv(row[key])).join(','));
  return [header, ...body].join('\n');
}

/** Triggers a client-side download of `content` without touching the network. */
export function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
