/**
 * Shared design-system constants.
 *
 * Single source of truth for the taxonomy and presentation metadata that is
 * otherwise duplicated across the form, the tables, and the charts.
 * Values follow stitch_student_feedback_analyzer / DESIGN.md.
 */

export const BRAND = {
  name: 'EduPulse Analytics',
  tagline: 'Institutional Intelligence',
}

export const CATEGORIES = [
  { value: 'Teaching Quality', label: 'Teaching Quality & Pedagogy' },
  { value: 'Course Content', label: 'Course Content & Rigor' },
  { value: 'Lab Facilities', label: 'Lab Facilities & Tooling' },
  { value: 'Classroom Facilities', label: 'Classroom Facilities & Acoustics' },
  { value: 'Assessment & Exams', label: 'Assessment, Quizzes & Exams' },
  { value: 'Faculty Interaction', label: 'Faculty Availability & Interaction' },
  { value: 'Other', label: 'Other Institutional Matter' },
]

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Mechanical Engineering',
  'Mathematics & Physics',
  'Humanities & Social Sciences',
]

/** Catalogue backing the course picker. Selecting a course syncs dept + faculty. */
export const COURSES = [
  {
    value: 'CS-301',
    label: 'CS-301: Advanced Data Structures & Algorithms',
    short: 'Adv Data Struct',
    department: 'Computer Science & Engineering',
    faculty: 'Dr. Alan Turing',
  },
  {
    value: 'ENG-204',
    label: 'ENG-204: Technical Writing & Research Ethics',
    short: 'Technical Writing',
    department: 'Humanities & Social Sciences',
    faculty: 'Prof. Elena Rostova',
  },
  {
    value: 'PHYS-102',
    label: 'PHYS-102: Electromagnetism & Statistical Mechanics',
    short: 'Electromagnetism',
    department: 'Mathematics & Physics',
    faculty: 'Dr. Richard Feynman',
  },
  {
    value: 'ME-410',
    label: 'ME-410: Finite Element Analysis & Dynamics',
    short: 'Finite Element Analysis',
    department: 'Mechanical Engineering',
    faculty: 'Prof. Nikola Tesla',
  },
]

/** Likert descriptors shown beneath the star control on the submission form. */
export const RATING_LABELS = {
  1: { text: 'Unsatisfactory - Severe issues encountered (1/5)', badge: 'Critical Concern' },
  2: { text: 'Below Average - Requires structural revision (2/5)', badge: 'Needs Improvement' },
  3: { text: 'Satisfactory - Met baseline expectations (3/5)', badge: 'Standard Alignment' },
  4: { text: 'Very Good - Highly informative and organized (4/5)', badge: 'Strong Performance' },
  5: { text: 'Excellent - Exceeded expectations across dimensions (5/5)', badge: 'Distinguished Pedagogic' },
}

export const COMMENT_MAX_LENGTH = 1000

/**
 * Sentiment presentation metadata. `dot` is the swatch colour, `chip` the
 * Tailwind component class from index.css.
 */
export const SENTIMENT = {
  positive: {
    label: 'Positive',
    chip: 'chip-positive',
    dot: 'bg-on-tertiary-container',
    text: 'text-on-tertiary-container',
    hex: '#009668',
    onHex: '#002113',
  },
  neutral: {
    label: 'Neutral',
    chip: 'chip-neutral',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    hex: '#eab308',
    onHex: '#451a03',
  },
  negative: {
    label: 'Issue',
    chip: 'chip-negative',
    dot: 'bg-error',
    text: 'text-error',
    hex: '#ba1a1a',
    onHex: '#93000a',
  },
}

export const SENTIMENT_KEYS = ['positive', 'neutral', 'negative']

/** Likert buckets, tightest score first — drives the distribution chart. */
export const RATING_BUCKETS = [
  { rating: 1, label: '1★', bar: 'bg-surface-container', hover: 'group-hover:bg-error' },
  { rating: 2, label: '2★', bar: 'bg-surface-container', hover: 'group-hover:bg-amber-500' },
  { rating: 3, label: '3★', bar: 'bg-surface-container', hover: 'group-hover:bg-amber-400' },
  { rating: 4, label: '4★', bar: 'bg-surface-container-high', hover: 'group-hover:bg-secondary' },
  { rating: 5, label: '5★', bar: 'bg-secondary', hover: 'group-hover:bg-secondary-container' },
]

export const TERM_OPTIONS = [
  'Fall Semester 2024',
  'Spring Semester 2024',
  'Fall Semester 2023',
  'Annual Retrospective 2023-2024',
]

export const ACTION_OPTIONS = [
  'Forward to Department IT / Facilities',
  'Notify Course Instructor',
  'Schedule In-Person Inspection',
  'Mark as Resolved',
  'Archive Record',
]