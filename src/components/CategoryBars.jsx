import Icon from './Icon';

/**
 * Mean rating per feedback category. Bars below 4.0★ are called out, since
 * that is where the design's accent treatment earns its keep.
 */
export default function CategoryBars({ stats }) {
  const rows = Object.entries(stats)
    .map(([category, { total, count }]) => ({
      category,
      mean: count ? total / count : 0,
      count,
    }))
    .sort((a, b) => b.mean - a.mean);

  if (rows.length === 0) {
    return (
      <div className="card p-space-lg">
        <span className="overline text-on-surface-variant">Dimension Audit</span>
        <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">Category-wise Average Ratings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant py-space-lg text-center">
          No rated submissions yet.
        </p>
      </div>
    );
  }

  const worst = rows[rows.length - 1];
  const flagged = worst.mean < 4;

  return (
    <div className="card p-space-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-space-md">
        <div>
          <span className="overline text-on-surface-variant">Dimension Audit</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
            Category-wise Average Ratings
          </h2>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">Scale: 1.0 – 5.0★</span>
      </div>

      <div className="flex flex-col gap-space-md my-space-sm">
        {rows.map((row) => {
          const isFlagged = flagged && row.category === worst.category;
          const width = `${(row.mean / 5) * 100}%`;
          const barColor = isFlagged ? 'bg-error' : row.mean < 4 ? 'bg-outline' : row.mean < 4.25 ? 'bg-secondary/80' : 'bg-secondary';

          return (
            <div key={row.category} className={`flex flex-col gap-1 ${isFlagged ? 'p-2 bg-error-container/20 rounded-xl' : ''}`}>
              <div className="flex justify-between items-center text-body-sm gap-2">
                <span className={`font-headline-sm text-body-md flex items-center gap-1 ${isFlagged ? 'text-error' : 'text-on-surface'}`}>
                  {isFlagged && <Icon name="priority_high" size={16} />}
                  {row.category}
                </span>
                <span className={`font-headline-sm text-body-md ${isFlagged ? 'text-error' : row.mean < 4 ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                  {row.mean.toFixed(1)} ★
                </span>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-space-xs text-body-sm text-on-surface-variant gap-2">
        <span>
          {rows.filter((r) => r.mean >= 4).length} component{rows.filter((r) => r.mean >= 4).length === 1 ? '' : 's'}{' '}
          benchmark above 4.0
        </span>
        {flagged ? (
          <span className="text-error font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            {worst.category} requires review
          </span>
        ) : (
          <span className="text-on-tertiary-container font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
            All dimensions on target
          </span>
        )}
      </div>
    </div>
  );
}