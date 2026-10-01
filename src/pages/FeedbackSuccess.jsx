import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Icon from '../components/Icon';
import { RATING_LABELS, SENTIMENT } from '../lib/design';

function readSubmission() {
  try {
    const raw = sessionStorage.getItem('last_submitted_feedback');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    // A corrupted or unavailable session store must not blank the page.
    console.warn('Could not read the last submission receipt', error);
    return null;
  }
}

function Receipt({ submission }) {
  const rating = Number(submission.rating) || 0;
  const label = RATING_LABELS[rating];
  const sentiment = SENTIMENT[submission.sentiment_label] || SENTIMENT.neutral;

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-space-md px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant">
        <div className="min-w-0">
          <span className="overline text-on-surface-variant">Submission Receipt</span>
          <p className="font-headline-sm text-headline-sm text-on-surface truncate mt-0.5">
            {submission.course_name || 'Course feedback'}
          </p>
        </div>
        <span className={`chip ${sentiment.chip} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
          {sentiment.label}
        </span>
      </header>

      <div className="p-space-lg space-y-space-lg">
        <div className="flex items-center gap-space-sm">
          {Array.from({ length: 5 }, (_, index) => (
            <Icon
              key={index}
              name={index < rating ? 'star' : 'star_outline'}
              size={28}
              className={index < rating ? 'text-secondary' : 'text-outline'}
            />
          ))}
          <span className="font-metric-lg-mobile sm:font-metric-lg text-metric-lg text-on-surface ml-auto">
            {rating}
            <span className="text-on-surface-variant">/5</span>
          </span>
        </div>

        {label && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            <span className="tag bg-secondary-container text-on-secondary-container mr-2">{label.badge}</span>
            {label.text}
          </p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div className="bg-surface-container-low rounded-xl p-space-md">
            <dt className="overline text-on-surface-variant">Dimension</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{submission.category || '—'}</dd>
          </div>
          <div className="bg-surface-container-low rounded-xl p-space-md">
            <dt className="overline text-on-surface-variant">Faculty</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{submission.faculty_name || '—'}</dd>
          </div>
          <div className="bg-surface-container-low rounded-xl p-space-md">
            <dt className="overline text-on-surface-variant">Department</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1">{submission.department || '—'}</dd>
          </div>
          <div className="bg-surface-container-low rounded-xl p-space-md">
            <dt className="overline text-on-surface-variant">Attribution</dt>
            <dd className="font-body-md text-body-md text-on-surface mt-1 flex items-center gap-1.5">
              {submission.is_anonymous ? (
                <>
                  <Icon name="incognito" size={16} className="text-outline" />
                  Anonymous
                </>
              ) : (
                'Identifiable'
              )}
            </dd>
          </div>
        </dl>

        {submission.comment && (
          <blockquote className="p-space-md bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface leading-relaxed">
            “{submission.comment}”
          </blockquote>
        )}
      </div>
    </section>
  );
}

export default function FeedbackSuccess() {
  // The receipt is read once from session storage, so lazy state initialisation
  // does the job useMemo was being asked for here.
  const [submission] = useState(readSubmission);

  useEffect(() => {
    if (!submission) return undefined;

    try {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return undefined;

      // Two offset bursts rather than one centre spray, per the design's motion spec.
      const end = Date.now() + 900;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#009668', '#4b41e1'] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#009668', '#4b41e1'] });

        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      return undefined;
    } catch (error) {
      console.warn('Celebration animation unavailable', error);
      return undefined;
    }
  }, [submission]);

  return (
    <div className="max-w-2xl mx-auto py-gutter animate-slide-up space-y-gutter">
      <section className="text-center">
        <span className="inline-flex p-space-lg rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed">
          <Icon name="check_circle" size={40} />
        </span>
        <span className="overline block text-on-tertiary-container mt-space-md">Transmission Complete</span>
        <h1 className="font-display-lg-mobile sm:font-display-lg text-display-lg text-on-surface mt-1">
          Thank you for your feedback
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-sm max-w-lg mx-auto">
          Your response has been logged and routed to the department review queue. Submissions are analysed for
          recurring themes, never for individual attribution.
        </p>
      </section>

      {submission ? (
        <Receipt submission={submission} />
      ) : (
        <section className="card p-space-lg text-center">
          <Icon name="receipt_long" size={32} className="text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
            No recent submission is stored in this browser session, so there is no receipt to display. Your
            feedback was still recorded.
          </p>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-space-md text-center">
        {[
          { icon: 'forum', title: 'Reviewed by the department', body: 'Faculty see themes, not identities.' },
          { icon: 'insights', title: 'Aggregated into trends', body: 'Responses build the semester baseline.' },
          { icon: 'lock', title: 'Anonymity respected', body: 'Identities are never exported.' },
        ].map((item) => (
          <div key={item.title} className="card p-space-md">
            <Icon name={item.icon} size={22} className="text-secondary" />
            <p className="font-headline-sm text-headline-sm text-on-surface mt-1.5">{item.title}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{item.body}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md">
        <Link to="/submit" className="btn-primary w-full sm:w-auto">
          <Icon name="edit_square" size={18} />
          Submit another response
        </Link>
        <Link to="/" className="btn-secondary w-full sm:w-auto">
          <Icon name="home" size={18} />
          Return to home
        </Link>
      </div>
    </div>
  );
}