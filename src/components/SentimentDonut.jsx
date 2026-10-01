import Icon from './Icon';
import { SENTIMENT, SENTIMENT_KEYS } from '../lib/design';

const DESCRIPTIONS = {
  positive: 'Constructive encouragement & praise',
  neutral: 'Descriptive observations without affect',
  negative: 'Bottlenecks, defects & complaints',
};

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Sentiment split as an SVG donut. Segments are stroked with cumulative
 * dashoffsets so the arcs join cleanly at any distribution.
 */
export default function SentimentDonut({ counts, total, precision = '98.4%' }) {
  const safeTotal = total || 0;

  const segments = SENTIMENT_KEYS.map((key) => {
    const count = counts[key] || 0;
    return { key, count, pct: safeTotal ? (count / safeTotal) * 100 : 0 };
  });

  // Offsets are a cumulative sum, computed as a pure fold so nothing is
  // reassigned during render.
  const arcs = segments.reduce((acc, segment) => {
    const length = (segment.pct / 100) * CIRCUMFERENCE;
    const offset = -acc.consumed;
    acc.consumed += length;
    acc.arcs.push({ ...segment, length, offset });
    return acc;
  }, { arcs: [], consumed: 0 }).arcs;

  const favorable = segments.find((s) => s.key === 'positive')?.pct ?? 0;

  return (
    <div className="card p-space-lg flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <span className="overline text-on-surface-variant">Natural Language NLP</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">Overall Sentiment Breakdown</h2>
        </div>
        <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-space-xs py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" /> Calibrated {precision}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-space-lg my-space-md">
        <div className="md:col-span-6 flex justify-center relative">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label="Sentiment distribution donut chart">
              <circle cx="50" cy="50" r={RADIUS} fill="transparent" stroke="var(--color-surface-container-low)" strokeWidth="12" />
              {arcs.map((arc) =>
                arc.pct > 0 ? (
                  <circle
                    key={arc.key}
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="transparent"
                    stroke={SENTIMENT[arc.key].hex}
                    strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
                    strokeDashoffset={arc.offset}
                    strokeLinecap={arc.key === 'positive' ? 'round' : 'butt'}
                    strokeWidth="12"
                  />
                ) : null
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-metric-lg text-metric-lg text-on-surface leading-none">
                {favorable.toFixed(0)}%
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-1">
                Favorable Index
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 flex flex-col gap-space-sm">
          {arcs.map((arc) => {
            const meta = SENTIMENT[arc.key];
            return (
              <div key={arc.key} className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${meta.dot}`} />
                  <div className="min-w-0">
                    <div className="font-headline-sm text-body-md text-on-surface leading-snug">{meta.label}</div>
                    <div className="font-body-sm text-[11px] text-on-surface-variant">{DESCRIPTIONS[arc.key]}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-headline-sm text-headline-sm ${meta.text}`}>{arc.pct.toFixed(1)}%</div>
                  <div className="font-label-sm text-[11px] text-on-surface-variant">
                    {arc.count.toLocaleString('en-US')} reviews
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-xs">
        <Icon name="info" size={16} className="text-secondary shrink-0" />
        <span>Includes confidence weighting based on comment length and syntax complexity.</span>
      </div>
    </div>
  );
}