import Icon from './Icon';

const TONES = {
  primary: { icon: 'stacked_line_chart', bg: 'bg-primary-container', text: 'text-on-primary-container', value: 'text-on-surface' },
  tertiary: { icon: 'sentiment_satisfied', bg: 'bg-surface-container-low', text: 'text-on-tertiary-container', value: 'text-on-surface' },
  amber: { icon: 'star', bg: 'bg-secondary-container', text: 'text-on-secondary-container', value: 'text-on-surface' },
  error: { icon: 'report_problem', bg: 'bg-error-container', text: 'text-on-error-container', value: 'text-on-surface' },
};

export default function StatCard({ label, value, suffix, sub, tone = 'primary', icon, progress }) {
  const t = TONES[tone] || TONES.primary;
  const iconName = icon || t.icon;

  return (
    <article className="card-interactive p-space-lg flex items-start gap-space-md">
      <span className={`p-3 rounded-2xl shrink-0 ${t.bg}`}>
        <Icon name={iconName} size={24} className={t.text} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="overline text-on-surface-variant">{label}</p>
        <p className={`font-metric-lg-mobile sm:font-metric-lg text-metric-lg text-on-surface leading-tight mt-1`}>
          {value}
          {suffix && <span className="font-body-md text-body-md text-on-surface-variant ml-1">{suffix}</span>}
        </p>

        {typeof progress === 'number' && (
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${t.text.replace('text-', 'bg-')}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
          </div>
        )}

        {sub && <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{sub}</p>}
      </div>
    </article>
  );
}