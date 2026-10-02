/**
 * Unit tests for the aggregation layer.
 *
 * This is the code that produced the original defect: a reader handed the wrong
 * shape fed `undefined` into `summarize()` and the dashboard rendered zeros
 * with no error anywhere. The Python suite pins the API contract; these pin the
 * arithmetic that consumes it, so a wrong number fails here instead of in a
 * screenshot.
 *
 * Runs with `npm test` (Node's built-in runner). No framework, no DOM.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_FILTERS,
  attachThemes,
  filterFeedback,
  optionsFrom,
  summarize,
  tallyThemes,
  toCsv,
} from './analytics.js';

const row = (over = {}) => ({
  id: 'fb-1',
  course_name: 'CS-301',
  department: 'Computer Science & Engineering',
  faculty_name: 'Dr. Alan Turing',
  category: 'Teaching Quality',
  rating: 5,
  sentiment_label: 'positive',
  comment: 'Great lectures.',
  is_anonymous: true,
  term: 'Fall 2024',
  student_name: null,
  ...over,
});

test('summarize: an empty corpus yields zeros rather than NaN', () => {
  const s = summarize([]);
  assert.equal(s.total, 0);
  assert.equal(s.avgRating, 0);
  assert.equal(s.positivePct, 0);
  assert.deepEqual(s.sentimentCounts, { positive: 0, neutral: 0, negative: 0 });
  assert.ok(Number.isFinite(s.avgRating));
});

test('summarize: totals, averages and buckets match the rows', () => {
  const rows = [
    row({ id: 'a', rating: 5, sentiment_label: 'positive' }),
    row({ id: 'b', rating: 3, sentiment_label: 'neutral' }),
    row({ id: 'c', rating: 1, sentiment_label: 'negative' }),
    row({ id: 'd', rating: 4, sentiment_label: 'positive' }),
  ];
  const s = summarize(rows);

  assert.equal(s.total, 4);
  assert.equal(s.ratedCount, 4);
  assert.equal(s.avgRating, 3.25);
  assert.deepEqual(s.ratingCounts, { 1: 1, 2: 0, 3: 1, 4: 1, 5: 1 });
  assert.deepEqual(s.sentimentCounts, { positive: 2, neutral: 1, negative: 1 });
  assert.equal(s.positivePct, 50);
  assert.equal(s.anonymousCount, 4);
});

test('summarize: an unrecognised sentiment label counts as neutral, not positive', () => {
  const s = summarize([row({ sentiment_label: 'ecstatic' })]);
  assert.deepEqual(s.sentimentCounts, { positive: 0, neutral: 1, negative: 0 });
  assert.equal(s.positivePct, 0);
});

test('summarize: out-of-range and non-numeric ratings are excluded, not averaged', () => {
  const s = summarize([
    row({ rating: 5 }),
    row({ rating: 0 }),
    row({ rating: 9 }),
    row({ rating: null }),
    row({ rating: 'not a number' }),
  ]);

  assert.equal(s.ratedCount, 1);
  assert.equal(s.avgRating, 5);
  // Still three rows for sentiment purposes - only the rating is discarded.
  assert.equal(s.total, 5);
});

test('summarize: a string rating from PostgREST is still counted', () => {
  const s = summarize([row({ rating: '4' })]);
  assert.equal(s.ratedCount, 1);
  assert.equal(s.avgRating, 4);
});

test('summarize: category means average only the rows that carry one', () => {
  const s = summarize([
    row({ category: 'Teaching Quality', rating: 5 }),
    row({ category: 'Teaching Quality', rating: 3 }),
    row({ category: 'Infrastructure', rating: 1 }),
    row({ category: null, rating: 5 }),
  ]);

  assert.equal(s.categoryStats['Teaching Quality'].count, 2);
  assert.equal(s.categoryStats['Teaching Quality'].total, 8);
  assert.equal(s.categoryStats.Infrastructure.total, 1);
});

test('summarize: tolerates null, undefined and a missing argument', () => {
  for (const input of [null, undefined, []]) {
    assert.equal(summarize(input).total, 0);
  }
});

test('tallyThemes: ranks by frequency and splits praise from issue', () => {
  const { praise, issue } = tallyThemes([
    { feedback_id: 'a', theme: 'Clear teaching', theme_type: 'praise' },
    { feedback_id: 'b', theme: 'Clear teaching', theme_type: 'praise' },
    { feedback_id: 'c', theme: 'Helpful faculty', theme_type: 'praise' },
    { feedback_id: 'd', theme: 'Slow lab systems', theme_type: 'issue' },
  ]);

  assert.equal(praise[0].theme, 'Clear teaching');
  assert.equal(praise[0].count, 2);
  assert.equal(praise[1].count, 1);
  assert.equal(issue.length, 1);
  assert.equal(issue[0].theme, 'Slow lab systems');
});

test('tallyThemes: the same name under a different type stays separate', () => {
  const { praise, issue } = tallyThemes([
    { feedback_id: 'a', theme: 'Clear teaching', theme_type: 'praise' },
    { feedback_id: 'b', theme: 'Clear teaching', theme_type: 'issue' },
  ]);
  assert.equal(praise.length, 1);
  assert.equal(issue.length, 1);
});

test('tallyThemes: rows without a theme are skipped, and empty input is safe', () => {
  const { praise, issue } = tallyThemes([
    { feedback_id: 'a', theme: null, theme_type: 'praise' },
    null,
  ]);
  assert.equal(praise.length, 0);
  assert.equal(issue.length, 0);
  assert.deepEqual(tallyThemes([]).praise, []);
  assert.deepEqual(tallyThemes(null).praise, []);
});

test('attachThemes: gives each row the theme names recorded for its id', () => {
  const rows = attachThemes(
    [row({ id: 'a' }), row({ id: 'b' })],
    [
      { feedback_id: 'a', theme: 'Clear teaching', theme_type: 'praise' },
      { feedback_id: 'a', theme: 'Helpful faculty', theme_type: 'praise' },
      { feedback_id: 'b', theme: 'Slow lab systems', theme_type: 'issue' },
    ],
  );

  assert.equal(rows[0].themes.length, 2);
  assert.ok(rows[0].themes.includes('Clear teaching'));
  // A row with no theme rows gets an empty array, never undefined - the
  // inspector renders a quote for each theme name it finds.
  assert.deepEqual(rows[1].themes, ['Slow lab systems']);
  assert.deepEqual(attachThemes([row({ id: 'zz' })], [])[0].themes, []);
});

test('filterFeedback: the default filter set is a genuine no-op', () => {
  const rows = [row({ id: 'a' }), row({ id: 'b', rating: 2 })];
  assert.equal(filterFeedback(rows, DEFAULT_FILTERS).length, 2);
  assert.equal(filterFeedback(rows, {}).length, 2);
  assert.equal(filterFeedback(rows).length, 2);
});

test('filterFeedback: search is case-insensitive across several fields', () => {
  const rows = [
    row({ id: 'a', comment: 'The lab was slow.' }),
    row({ id: 'b', comment: 'Excellent.', faculty_name: 'Dr. Grace Hopper' }),
  ];

  assert.deepEqual(filterFeedback(rows, { search: 'LAB' }).map((r) => r.id), ['a']);
  assert.deepEqual(filterFeedback(rows, { search: 'grace' }).map((r) => r.id), ['b']);
});

test('filterFeedback: filters are AND-ed, and rating is compared as a string', () => {
  const rows = [
    row({ id: 'a', rating: 5, sentiment_label: 'positive' }),
    row({ id: 'b', rating: 1, sentiment_label: 'negative' }),
  ];

  assert.deepEqual(
    filterFeedback(rows, { rating: 5, sentiment: 'positive' }).map((r) => r.id),
    ['a'],
  );
  // Number and string spellings of the same filter agree.
  assert.deepEqual(filterFeedback(rows, { rating: '5' }).map((r) => r.id), ['a']);
  assert.deepEqual(filterFeedback(rows, { rating: 5 }).map((r) => r.id), ['a']);
});

test('filterFeedback: tolerates null input and missing fields', () => {
  assert.deepEqual(filterFeedback(null), []);
  assert.equal(filterFeedback([row({ course_name: null })], { course: 'CS-301' }).length, 0);
});

test('optionsFrom: distinct, sorted, and free of empty values', () => {
  const rows = [
    row({ faculty_name: 'Dr. Turing' }),
    row({ faculty_name: 'Dr. Ada' }),
    row({ faculty_name: 'Dr. Turing' }),
    row({ faculty_name: null }),
    row({ faculty_name: '' }),
  ];
  assert.deepEqual(optionsFrom(rows, 'faculty_name'), ['Dr. Ada', 'Dr. Turing']);
  assert.deepEqual(optionsFrom([], 'category'), []);
  assert.deepEqual(optionsFrom(null, 'category'), []);
});

test('toCsv: emits a header and one line per row', () => {
  const csv = toCsv([row(), row()]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[0].startsWith('Ref,Logged,Respondent'));
  assert.ok(lines[1].includes('CS-301'));
});

test('toCsv: escapes commas, quotes and newlines per RFC 4180', () => {
  const csv = toCsv([row({ comment: 'Bad, "very" bad.\nSecond line' })]);
  assert.ok(csv.includes('"Bad, ""very"" bad.\nSecond line"'));
});

test('toCsv: null fields become empty cells, and empty input is header-only', () => {
  const csv = toCsv([row({ student_name: null, department: null })]);
  assert.ok(csv.split('\n')[1].includes(',,'));
  assert.equal(toCsv([]), 'Ref,Logged,Respondent,Anonymous,Department,Course,Faculty,Category,Rating,Sentiment,Comment');
  assert.equal(toCsv(null).split('\n').length, 1);
});