import Icon from './Icon';
import { COURSES, SENTIMENT } from '../lib/design';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

/** Course strings are stored as "CS-301: Advanced Data..."; prefer the short label. */
function shortCourse(courseName) {
  const match = COURSES.find((course) => (courseName || '').startsWith(course.value));
  return match ? `${match.value} · ${match.short}` : courseName || '—';
}

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5" title={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon
          key={index}
          name={index < rating ? 'star' : 'star_outline'}
          size={15}
          className={index < rating ? 'text-secondary' : 'text-outline'}
        />
      ))}
    </span>
  );
}

export default function FeedbackTable({
  feedback,
  onSelect,
  selectedId,
  maxRows,
  emptyMessage = 'No responses match the current filters.',
  showComment = false,
}) {
  const rows = maxRows ? (feedback || []).slice(0, maxRows) : feedback || [];

  if (rows.length === 0) {
    return (
      <div className="py-space-xl text-center">
        <Icon name="search_off" size={32} className="text-outline" />
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline-variant">
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Ref</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Respondent</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Course</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Category</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Rating</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Sentiment</th>
            <th className="overline text-on-surface-variant py-space-sm pr-space-sm whitespace-nowrap">Logged</th>
            {onSelect && <th className="py-space-sm" aria-label="Inspect" />}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const sentiment = SENTIMENT[row.sentiment_label] || SENTIMENT.neutral;
            const isSelected = selectedId === row.id;

            return (
              <tr
                key={row.id ?? index}
                onClick={onSelect ? () => onSelect(row) : undefined}
                className={`border-b border-outline-variant/50 transition-colors ${
                  onSelect ? 'cursor-pointer hover:bg-surface-container-low' : ''
                } ${isSelected ? 'bg-primary-container/30' : ''}`}
              >
                <td className="py-space-sm pr-space-sm font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                  {String(row.id ?? index).slice(0, 8).toUpperCase()}
                </td>

                <td className="py-space-sm pr-space-sm whitespace-nowrap">
                  <span className="font-body-md text-body-md text-on-surface flex items-center gap-1.5">
                    {row.is_anonymous ? (
                      <>
                        <Icon name="incognito" size={15} className="text-outline" />
                        <span className="text-on-surface-variant">Anonymous</span>
                      </>
                    ) : (
                      row.student_name || '—'
                    )}
                  </span>
                </td>

                <td className="py-space-sm pr-space-sm font-body-sm text-body-sm text-on-surface whitespace-nowrap">
                  {shortCourse(row.course_name)}
                </td>

                <td className="py-space-sm pr-space-sm font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                  {row.category || '—'}
                </td>

                <td className="py-space-sm pr-space-sm whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    <Stars rating={Number(row.rating) || 0} />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{row.rating}</span>
                  </span>
                </td>

                <td className="py-space-sm pr-space-sm whitespace-nowrap">
                  <span className={`chip ${sentiment.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
                    {sentiment.label}
                  </span>
                </td>

                <td className="py-space-sm pr-space-sm font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                  {row.created_at ? DATE_FMT.format(new Date(row.created_at)) : '—'}
                </td>

                {showComment && (
                  <td className="py-space-sm pr-space-sm max-w-md">
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{row.comment}</p>
                  </td>
                )}

                {onSelect && (
                  <td className="py-space-sm text-right">
                    <Icon name="chevron_right" size={18} className="text-outline" />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}