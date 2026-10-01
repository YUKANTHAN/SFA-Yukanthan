import { useMemo } from 'react';
import Icon from './Icon';
import { tallyThemes } from '../lib/analytics';

const MAX_ROWS = 3;

const COLUMN = {
  praise: {
    heading: 'Top 3 Praises',
    subheading: 'Validated pedagogical strengths',
    accent: 'bg-on-tertiary-container',
    iconBg: 'bg-surface-container-low',
    icon: 'recommend',
    iconText: 'text-on-tertiary-container',
    badgeBg: 'bg-surface-container-low',
    badgeText: 'text-on-tertiary-container',
    chipBg: 'bg-surface-container-low',
    footText: 'text-on-tertiary-container',
    rankBg: 'bg-on-tertiary-container',
    rankText: 'text-on-tertiary',
    action: 'Recommend faculty commendations',
    empty: 'No praise themes detected in this corpus.',
  },
  issue: {
    heading: 'Top 3 Institutional Friction Points',
    subheading: 'Prioritised operational interventions',
    accent: 'bg-error',
    iconBg: 'bg-error-container',
    icon: 'report_problem',
    iconText: 'text-error',
    badgeBg: 'bg-error-container',
    badgeText: 'text-error',
    chipBg: 'bg-error-container/20',
    footText: 'text-error',
    rankBg: 'bg-error',
    rankText: 'text-on-error',
    action: 'Dispatch ticket to Facilities & Academic Senate',
    empty: 'No issue themes detected in this corpus.',
  },
};

function pickQuote(feedback, themeName) {
  const match = feedback.find((item) => (item.themes || []).includes(themeName));
  return match?.comment || null;
}

function ThemeColumn({ variant, entries, feedback, mentions, label }) {
  const style = COLUMN[variant];

  return (
    <div className="card p-space-lg relative overflow-hidden flex flex-col justify-between">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.accent}`} />

      <div>
        <div className="flex items-center justify-between gap-space-sm mb-space-md">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className={`p-2 rounded-xl shrink-0 ${style.iconBg}`}>
              <Icon name={style.icon} size={20} className={style.iconText} />
            </span>
            <div className="min-w-0">
              <h3 className="font-headline-md text-headline-md text-on-surface leading-snug">{style.heading}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{style.subheading}</p>
            </div>
          </div>

          <span className={`chip ${style.badgeBg} ${style.badgeText} shrink-0`}>
            {mentions.toLocaleString('en-US')} {label}
          </span>
        </div>

        {entries.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant py-space-lg text-center">{style.empty}</p>
        ) : (
          <ul className="space-y-space-md">
            {entries.slice(0, MAX_ROWS).map((entry, index) => {
              const quote = pickQuote(feedback, entry.theme);
              return (
                <li key={entry.theme} className={`p-space-md ${style.chipBg} rounded-xl`}>
                  <div className="flex items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-label-sm text-[11px] font-bold ${style.rankBg} ${style.rankText}`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface truncate">{entry.theme}</span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-semibold shrink-0 ${style.badgeText}`}>
                      {entry.count.toLocaleString('en-US')} {entry.count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>

                  {quote && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 pl-[1.75rem] italic line-clamp-2">
                      “{quote}”
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`mt-space-md pt-space-xs flex items-center justify-between gap-space-sm font-headline-sm text-headline-sm font-semibold ${style.footText}`}>
        <span>{style.action}</span>
        <Icon name="arrow_forward" size={18} />
      </div>
    </div>
  );
}

/**
 * `feedback` must already carry theme names (see `attachThemes`) so each theme can
 * be paired with a verbatim quote as evidence.
 */
export default function TopInsights({ feedback, themes }) {
  const { praise, issue } = useMemo(() => tallyThemes(themes), [themes]);

  const praiseMentions = praise.reduce((sum, entry) => sum + entry.count, 0);
  const issueMentions = issue.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
      <ThemeColumn
        variant="praise"
        entries={praise}
        feedback={feedback}
        mentions={praiseMentions}
        label={praiseMentions === 1 ? 'mention' : 'mentions'}
      />
      <ThemeColumn
        variant="issue"
        entries={issue}
        feedback={feedback}
        mentions={issueMentions}
        label={issueMentions === 1 ? 'mention' : 'mentions'}
      />
    </section>
  );
}