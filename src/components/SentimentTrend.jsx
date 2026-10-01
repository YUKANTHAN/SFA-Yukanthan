import { useMemo } from 'react';
import { SENTIMENT_KEYS } from '../lib/design';

const VIEW_W = 500;
const VIEW_H = 200;
const FLOOR = 190;
const CEILING = 25;
const MAX_BUCKETS = 8;

/**
 * Sentiment over time, bucketed weekly from real submission timestamps.
 * Values are percentages of each bucket's own volume, so a quiet week is not
 * read as a collapse in sentiment.
 */
export default function SentimentTrend({ feedback }) {
  const buckets = useMemo(() => {
    const dated = (feedback || [])
      .map((item) => ({ item, at: new Date(item.created_at) }))
      .filter(({ at }) => !Number.isNaN(at.getTime()));

    if (dated.length === 0) return [];

    const times = dated.map(({ at }) => at.getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);

    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const span = Math.max(max - min, WEEK);
    const bucketCount = Math.min(Math.max(Math.ceil(span / WEEK), 1), MAX_BUCKETS);
    const bucketSpan = span / bucketCount;

    const groups = Array.from({ length: bucketCount }, () => ({
      positive: 0,
      neutral: 0,
      negative: 0,
    }));

    dated.forEach(({ item, at }) => {
      const index = Math.min(Math.floor((at.getTime() - min) / bucketSpan), bucketCount - 1);

      // Rows carrying an unrecognised label are tallied as neutral, never dropped.
      const label = SENTIMENT_KEYS.includes(item.sentiment_label) ? item.sentiment_label : 'neutral';
      groups[index][label] += 1;
    });

    return groups.map((group, index) => {
      const total = group.positive + group.neutral + group.negative;
      return {
        label: index === 0 ? 'Week 1' : `W${index + 1}`,
        total,
        pct: {
          positive: total ? (group.positive / total) * 100 : 0,
          neutral: total ? (group.neutral / total) * 100 : 0,
          negative: total ? (group.negative / total) * 100 : 0,
        },
      };
    });
  }, [feedback]);

  if (buckets.length === 0) {
    return (
      <div className="card p-space-lg">
        <span className="overline text-on-surface-variant">Temporal Dynamic</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">Sentiment Trends Over Time</h2>
        <p className="font-body-md text-body-md text-on-surface-variant py-space-xl text-center">
          No timestamped submissions to plot yet.
        </p>
      </div>
    );
  }

  const toY = (pct) => FLOOR - (Math.min(Math.max(pct, 0), 100) / 100) * (FLOOR - CEILING);
  const step = buckets.length > 1 ? VIEW_W / (buckets.length - 1) : 0;

  const toPath = (key) =>
    buckets
      .map((bucket, index) => `${index === 0 ? 'M' : 'L'} ${(index * step).toFixed(1)},${toY(bucket.pct[key]).toFixed(1)}`)
      .join(' ');

  // Highlight the worst negative bucket, mirroring the design's midterm callout.
  let peakIndex = 0;
  buckets.forEach((bucket, index) => {
    if (bucket.pct.negative > buckets[peakIndex].pct.negative) peakIndex = index;
  });
  const peak = buckets[peakIndex];
  const hasPeak = peak.pct.negative > 0;

  const areaPath = `${toPath('positive')} L ${((buckets.length - 1) * step).toFixed(1)},${FLOOR} L 0,${FLOOR} Z`;

  return (
    <div className="card p-space-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-space-xs gap-space-md flex-wrap">
        <div>
          <span className="overline text-on-surface-variant">Temporal Dynamic</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">Sentiment Trends Over Time</h2>
        </div>
        <div className="flex items-center gap-space-sm font-label-sm text-label-sm">
          <span className="flex items-center gap-1 text-on-tertiary-container">
            <span className="w-2.5 h-1 bg-on-tertiary-container rounded" /> Positive
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2.5 h-1 bg-amber-500 rounded" /> Neutral
          </span>
          <span className="flex items-center gap-1 text-error">
            <span className="w-2.5 h-1 bg-error rounded" /> Negative
          </span>
        </div>
      </div>

      <div className="relative w-full h-56 my-space-md">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Sentiment trend over time">
          <defs>
            <linearGradient id="positiveGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#009668" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#009668" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[40, 90, 140].map((y) => (
            <line key={y} stroke="var(--color-surface-container-low)" strokeWidth="1.5" x1="0" x2={VIEW_W} y1={y} y2={y} />
          ))}

          <path d={areaPath} fill="url(#positiveGrad)" />
          <path d={toPath('positive')} fill="none" stroke="#009668" strokeLinecap="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <path d={toPath('neutral')} fill="none" stroke="#eab308" strokeDasharray="4 2" strokeLinecap="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          <path d={toPath('negative')} fill="none" stroke="#ba1a1a" strokeLinecap="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />

          {hasPeak && (
            <circle cx={(peakIndex * step).toFixed(1)} cy={toY(peak.pct.negative).toFixed(1)} fill="#ba1a1a" r="4" />
          )}
        </svg>

        {hasPeak && (
          <div className="absolute px-space-xs py-0.5 rounded shadow-e2 bg-inverse-surface text-inverse-on-surface font-label-sm text-[10px] flex items-center gap-1 whitespace-nowrap"
            style={{
              left: `${(peakIndex / Math.max(buckets.length - 1, 1)) * 100}%`,
              top: `${(toY(peak.pct.negative) / VIEW_H) * 100}%`,
              transform: 'translate(-50%, -160%)',
            }}
          >
            <span>
              {peak.label} peak: {peak.pct.negative.toFixed(1)}% issues
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm pt-space-xs px-1">
        {buckets.map((bucket, index) => (
          <span key={`${bucket.label}-${index}`}>{bucket.label}</span>
        ))}
      </div>
    </div>
  );
}