import { RATING_BUCKETS } from '../lib/design';

/**
 * Likert breakdown. Pure CSS bars per DESIGN.md rather than a chart library,
 * which keeps the hover affordance and the tabular labels in the design's idiom.
 */
export default function RatingDistribution({ counts, total }) {
  const safeTotal = total || 0;

  const rows = RATING_BUCKETS.map((bucket) => {
    const count = counts[bucket.rating] || 0;
    const pct = safeTotal ? (count / safeTotal) * 100 : 0;
    return { ...bucket, count, pct };
  });

  const topBar = rows.reduce((max, row) => (row.pct > max ? row.pct : max), 0) || 1;
  const approval = rows.filter((r) => r.rating >= 4).reduce((sum, r) => sum + r.pct, 0);

  return (
    <div className="card p-space-lg flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <span className="overline text-on-surface-variant">Likert Breakdown</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
            Rating Distribution (1 to 5 Stars)
          </h2>
        </div>
        <span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-0.5 rounded-md text-on-surface">
          N={safeTotal.toLocaleString('en-US')}
        </span>
      </div>

      <div className="my-space-lg">
        <div className="h-56 flex items-end justify-between gap-space-sm pt-space-md px-2">
          {rows.map((row) => (
            <div key={row.rating} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className={`font-label-sm text-label-sm font-semibold ${
                  row.rating === 5 ? 'text-secondary group-hover:text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                }`}
              >
                {row.pct.toFixed(0)}%
              </div>
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${row.bar} ${row.hover}`}
                style={{ height: `${Math.max((row.pct / topBar) * 100, row.pct > 0 ? 3 : 0)}%` }}
                title={`${row.count} response${row.count === 1 ? '' : 's'}`}
              />
              <span
                className={`font-label-sm text-label-sm flex items-center gap-0.5 ${
                  row.rating === 5 ? 'text-secondary font-bold' : 'text-on-surface font-medium'
                }`}
              >
                {row.label}
              </span>
              <span
                className={`font-label-sm text-[10px] ${
                  row.rating === 5 ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                {row.count.toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-space-sm bg-surface-container-low px-space-md py-space-xs rounded-xl">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {approval >= 70 ? 'Skewed toward high approval' : approval >= 50 ? 'Evenly split across the scale' : 'Skewed toward critical ratings'}
        </span>
        <span className="font-label-sm text-label-sm font-semibold text-secondary">
          {approval.toFixed(0)}% Positive Core (4-5★)
        </span>
      </div>
    </div>
  );
}