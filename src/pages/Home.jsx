import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const FEATURES = [
  {
    icon: 'neurology',
    iconBg: 'bg-tertiary-fixed',
    iconColor: 'text-tertiary-container',
    title: 'Sentiment Analysis',
    body: 'Contextual parsing classifies narrative evaluations into sentiment poles with high-resolution theme extraction.',
    footer: (
      <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-2">
        {[
          { label: 'Positive', pct: '82%', dot: 'bg-on-tertiary-container', text: 'text-on-tertiary-container' },
          { label: 'Neutral / Constructive', pct: '11%', dot: 'bg-amber-500', text: 'text-on-surface' },
          { label: 'Critical Issues', pct: '7%', dot: 'bg-error', text: 'text-error' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between font-label-sm text-label-sm">
            <span className={`flex items-center gap-1.5 ${row.text} font-medium`}>
              <span className={`w-2 h-2 rounded-full ${row.dot}`} />
              {row.label}
            </span>
            <span className="text-on-surface">{row.pct}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: 'monitoring',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-secondary',
    title: 'Analytics Dashboard',
    body: 'Comprehensive KPI suites displaying distribution spreads, cross-department comparisons and longitudinal trends over multi-year cohorts.',
    footer: (
      <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-1.5">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
          Semester Cohort Variance
        </span>
        <div className="h-16 flex items-end gap-2 pt-2">
          {[
            { term: 'FA22', h: '60%' },
            { term: 'SP23', h: '75%' },
            { term: 'FA23', h: '80%' },
            { term: 'SP24', h: '92%' },
          ].map((bar) => (
            <div
              key={bar.term}
              style={{ height: bar.h }}
              className={`flex-1 rounded-t flex items-center justify-center font-label-sm text-[9px] ${
                bar.term === 'SP24'
                  ? 'bg-secondary text-on-secondary font-bold'
                  : 'bg-surface-container-highest text-on-surface-variant'
              }`}
            >
              {bar.term}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: 'auto_awesome',
    iconBg: 'bg-surface-container-high',
    iconColor: 'text-primary-container',
    title: 'Top Issues & Praises',
    body: 'Pattern clustering isolates concrete pain points while shining light on stellar faculty impact across the corpus.',
    footer: (
      <div className="flex flex-col gap-2">
        <div className="px-space-sm py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <Icon name="thumb_up" size={14} />
            Interactive Demo Sessions
          </span>
          <span className="font-bold">+38 praises</span>
        </div>
        <div className="px-space-sm py-1.5 rounded-lg bg-error-container text-on-error-container flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <Icon name="warning" size={14} />
            Lab Room 402 Workstations
          </span>
          <span className="font-bold">14 alerts</span>
        </div>
      </div>
    ),
  },
];

const STEPS = [
  {
    number: '01',
    numberClass: 'text-surface-container-highest',
    iconBg: 'bg-surface-container-low',
    iconColor: 'text-on-surface',
    icon: 'how_to_vote',
    title: 'Submit Anonymously',
    body: 'Students share uninhibited evaluations through encrypted forms. Zero metadata or identity trails are preserved, ensuring pure constructive candor.',
  },
  {
    number: '02',
    numberClass: 'text-secondary/30',
    iconBg: 'bg-secondary-fixed',
    iconColor: 'text-secondary',
    icon: 'psychology_alt',
    title: 'Sentiment & Themes Extracted',
    body: 'Each verbatim is scored server-side against a curated lexicon and tagged with its polarity and the academic topics it raises, so every label is reproducible and auditable.',
  },
  {
    number: '03',
    numberClass: 'text-on-tertiary-container/30',
    iconBg: 'bg-tertiary-fixed',
    iconColor: 'text-tertiary-container',
    icon: 'insights',
    title: 'Actionable Changes',
    body: 'Deans, department heads and faculty review synthesis briefs to adapt instructional pacing, update lab resources and recognise excellence.',
  },
];

const DEPARTMENTS = [
  { code: 'CS', name: 'Computer Science & Engineering', meta: '2,410 submissions • 94% response', score: '91.2%', strong: true },
  { code: 'BIO', name: 'Biological Sciences', meta: '1,894 submissions • 89% response', score: '86.7%', strong: false },
  { code: 'HUM', name: 'Humanities & Philosophy', meta: '1,240 submissions • 92% response', score: '88.4%', strong: false },
];

const RATING_MIX = [
  { label: '5 Stars', pct: 74, bar: 'bg-secondary' },
  { label: '4 Stars', pct: 18, bar: 'bg-secondary-container' },
  { label: '3 Stars', pct: 5, bar: 'bg-outline-variant' },
  { label: '1-2 Stars', pct: 3, bar: 'bg-error' },
];

function HeroPreview() {
  return (
    <div className="relative w-full max-w-[620px] bg-surface-container-lowest rounded-2xl p-space-md shadow-e4">
      <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low/60 -mx-space-md -mt-space-md px-space-md pt-space-sm rounded-t-2xl">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="w-2.5 h-2.5 rounded-full bg-outline-variant/60" />
          ))}
          <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">
            PulseStream • Department of Computer Science
          </span>
        </div>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container font-semibold">
          Active Session
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {/* Sentiment donut */}
        <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Overall Sentiment</span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-lowest px-2 py-0.5 rounded-full font-medium">
              +5.4% YoY
            </span>
          </div>
          <div className="relative flex items-center justify-center my-space-sm">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" fill="none" r="50" stroke="var(--color-surface-container-highest)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="50"
                stroke="var(--color-on-tertiary-container)"
                strokeDasharray="314.15"
                strokeDashoffset="37.7"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-metric-xl text-metric-xl text-on-surface leading-none">88%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Positive</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />Pos 88%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-on-secondary" />Neu 8%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error" />Crit 4%
            </span>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="p-space-md rounded-xl bg-surface-container-low/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant">Rating Distribution</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">N=4,821</span>
          </div>
          <div className="space-y-2 py-1">
            {RATING_MIX.map((row) => (
              <div key={row.label} className="space-y-0.5">
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface">
                  <span className="flex items-center gap-1">
                    <Icon name="star" size={12} fill className="text-amber-500" />
                    {row.label}
                  </span>
                  <span className="font-semibold">{row.pct}%</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 text-center">
            <span className="font-headline-sm text-headline-sm text-on-surface">4.72</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant"> / 5.0 Composite Mean</span>
          </div>
        </div>
      </div>

      {/* Live verbatim strip */}
      <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low/70 flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-tertiary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-on-tertiary-container" />
            </span>
            <span className="font-label-md text-label-md text-on-surface">Live Verbatim Stream</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Momentum</span>
            <svg className="w-24 h-6 text-on-tertiary-container" fill="none" viewBox="0 0 100 24" aria-hidden="true">
              <path d="M0 18 Q 20 6, 35 12 T 70 8 T 100 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
        <div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container font-label-sm text-label-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              Positive Sentiment (0.97)
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">3 mins ago • CS301</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface italic">
            “Prof. Chen explained complex quantum concepts with brilliant clarity! The interactive lab
            visualizer helped bridge theory into actual code.”
          </p>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-6 hidden sm:flex items-center gap-2 px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-e3">
        <Icon name="verified_user" size={18} className="text-secondary" />
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface">FERPA Protected</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">100% Anonymized Corpus</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <div className="relative w-full overflow-hidden bg-surface pb-space-xl">
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#0b1c30 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1600px] mx-auto px-margin pt-space-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
            <div className="lg:col-span-6 flex flex-col items-start gap-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-low text-secondary font-label-md text-label-md shadow-e1">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                Academic Intelligence & Sentiment AI v2.4
              </div>

              <div className="space-y-space-sm">
                <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight">
                  Student Feedback
                  <br className="hidden sm:inline" /> <span className="text-secondary">Analyzer</span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                  Turn student feedback into meaningful academic insights. Empower faculty, elevate
                  curriculum design, and monitor campus pedagogical climate with real-time sentiment
                  analysis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-space-md pt-space-xs w-full sm:w-auto">
                <Link to="/submit" className="btn-primary bg-primary-container text-on-secondary shadow-e2 hover:bg-inverse-surface">
                  Give Feedback
                  <Icon name="arrow_forward" size={18} />
                </Link>
                <Link to="/login" className="btn-secondary bg-surface-container-lowest text-on-surface shadow-e1 hover:bg-surface-container-low">
                  <Icon name="admin_panel_settings" size={18} className="text-secondary" />
                  Admin Dashboard
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-space-md pt-space-lg w-full max-w-lg">
                {[
                  { value: '124k+', label: 'Evaluations', strong: false },
                  { value: '98.4%', label: 'Accuracy', strong: true },
                  { value: '42', label: 'Departments', strong: false },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span
                      className={`font-metric-lg-mobile sm:font-metric-lg text-metric-lg ${
                        stat.strong ? 'text-on-tertiary-container' : 'text-on-surface'
                      }`}
                    >
                      {stat.value}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 relative flex justify-center">
              <HeroPreview />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Value highlights ---------------- */}
      <div className="w-full bg-surface-container-lowest py-space-xl">
        <div className="max-w-[1600px] mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-e3 h-[340px] bg-primary-container">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, transparent 55%), radial-gradient(circle at 70% 25%, rgba(111,251,190,0.25) 0%, transparent 50%)',
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-space-lg gap-space-sm">
                <div className="flex items-center gap-2 text-secondary-fixed">
                  <Icon name="groups" size={20} />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Lecture halls · Labs · Online
                  </span>
                </div>
                <span className="font-headline-md text-headline-md text-on-secondary">
                  Capturing the authentic student voice across lecture halls, labs and online courses.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              <span className="overline text-secondary">Campus-Wide Academic Observability</span>
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface">
                From raw student text to strategic curriculum improvements.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Traditional end-of-term evaluations often arrive too late for course corrections.
                EduPulse uses lightweight mid-term check-ins and contextual parsing to surface
                actionable friction points before exam periods.
              </p>
              <div className="grid grid-cols-2 gap-space-md pt-space-xs">
                {[
                  { title: 'Mid-Term Interventions', body: 'Identify difficult syllabus checkpoints within the first 4 weeks of instruction.' },
                  { title: 'Unbiased Benchmarks', body: 'Normalize scores against course difficulty, class size and requirement type.' },
                ].map((item) => (
                  <div key={item.title} className="p-space-md rounded-xl bg-surface-container-low">
                    <span className="font-headline-sm text-headline-sm text-on-surface block mb-1">{item.title}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{item.body}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Feature bento ---------------- */}
      <div className="w-full bg-surface py-space-xl">
        <div className="max-w-[1600px] mx-auto px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div>
              <span className="overline text-secondary">Engineered for Academic Rigor</span>
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mt-1">
                Core Analytical Capabilities
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              Built specifically around pedagogical taxonomies rather than generic corporate support
              algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col justify-between p-space-lg rounded-[14px] bg-surface-container-lowest shadow-e1 hover:shadow-e2 transition-shadow"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-space-md`}>
                    <Icon name={feature.icon} size={24} className={feature.iconColor} />
                  </div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-space-xs">{feature.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">{feature.body}</p>
                </div>
                {feature.footer}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- How it works ---------------- */}
      <div className="w-full bg-surface-container-low py-space-xl">
        <div className="max-w-[1600px] mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="overline text-secondary">Transparent & Structured</span>
            <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mt-1">
              How EduPulse Powers Campus Betterment
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              A synchronized feedback lifecycle designed for student safety, faculty integrity and
              administrative action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">
            {STEPS.map((step) => (
              <div key={step.number} className="relative flex flex-col p-space-lg rounded-2xl bg-surface-container-lowest shadow-e1">
                <div className="flex items-center justify-between mb-space-md">
                  <span className={`font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg ${step.numberClass}`}>
                    {step.number}
                  </span>
                  <div className={`w-10 h-10 rounded-full ${step.iconBg} flex items-center justify-center ${step.iconColor}`}>
                    <Icon name={step.icon} size={20} />
                  </div>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-space-xs">{step.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Department benchmarks ---------------- */}
      <div className="w-full bg-surface py-space-xl">
        <div className="max-w-[1600px] mx-auto px-margin">
          <div className="rounded-2xl bg-surface-container-lowest shadow-e2 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 p-space-xl flex flex-col justify-between">
              <div>
                <span className="overline text-secondary">Holistic Campus Health</span>
                <h3 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mt-2 mb-space-sm">
                  Cross-Department Benchmark Indices
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  Identify systemic institutional trends across STEM, Humanities and Professional
                  Graduate Programs with weighted normalization.
                </p>
              </div>
              <div className="space-y-space-sm">
                {[
                  'Weighted for core curriculum vs electives',
                  'Dynamic adjustment for cohort class size',
                  'Exportable to University Senate accreditation reviews',
                ].map((line) => (
                  <div key={line} className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
                    <Icon name="check_circle" size={18} className="text-on-tertiary-container" fill />
                    {line}
                  </div>
                ))}
              </div>
              <div className="pt-space-md">
                <Link to="/dashboard" className="inline-flex items-center gap-2 font-label-md text-label-md text-secondary hover:text-on-secondary-fixed transition-colors">
                  View Department Rankings
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 bg-surface-container-low p-space-xl flex flex-col justify-center">
              <div className="space-y-4">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept.code} className="p-space-md rounded-xl bg-surface-container-lowest shadow-e1 flex items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md min-w-0">
                      <span className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-headline-sm text-headline-sm text-on-surface shrink-0">
                        {dept.code}
                      </span>
                      <div className="min-w-0">
                        <span className="font-headline-sm text-headline-sm text-on-surface block truncate">{dept.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{dept.meta}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-metric-lg text-metric-lg ${dept.strong ? 'text-on-tertiary-container' : 'text-on-surface'}`}>
                        {dept.score}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Positivity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CTA banner ---------------- */}
      <div className="w-full bg-primary-container text-on-secondary py-space-xl">
        <div className="max-w-[1600px] mx-auto px-margin">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-2 max-w-2xl text-center lg:text-left">
              <span className="overline text-secondary-fixed">Ready to Shape Your Academic Experience?</span>
              <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-secondary font-bold">
                Your Perspective Drives Real Campus Impact
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary-container">
                Submissions take under 3 minutes and directly influence curriculum revisions, lecture
                lab upgrades and faculty reviews.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-space-md">
              <Link to="/submit" className="btn bg-surface-container-lowest text-primary shadow-e3 hover:bg-surface-container-low">
                <Icon name="rate_review" size={18} className="text-secondary" />
                Submit Student Evaluation
              </Link>
              <Link to="/login" className="btn bg-transparent text-on-secondary hover:bg-surface-container-lowest/10">
                Faculty & Provost Sign In
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}