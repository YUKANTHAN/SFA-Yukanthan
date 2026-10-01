import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import RatingInput from '../components/RatingInput';
import { CATEGORIES, COMMENT_MAX_LENGTH, COURSES, DEPARTMENTS, RATING_LABELS } from '../lib/design';
import { isSupabaseConfigured, submitFeedbackData } from '../lib/supabase';

const DRAFT_KEY = 'student_feedback_draft';

const EMPTY_FORM = {
  // `course_code` is the select's value; `course_name` is the human-readable
  // label that gets persisted and displayed. Keeping both avoids the select
  // rendering empty when the stored value is the full course title.
  course_code: '',
  course_name: '',
  department: '',
  faculty_name: '',
  category: '',
  rating: 0,
  comment: '',
  is_anonymous: true,
};

function FieldLabel({ htmlFor, children, hint }) {
  return (
    <>
      <label htmlFor={htmlFor} className="font-headline-sm text-headline-sm text-on-surface flex items-center justify-between">
        {children}
      </label>
      {hint && <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>}
    </>
  );
}

function SuccessModal({ result, onAnother }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-margin animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-e4 p-space-xl flex flex-col items-center text-center gap-space-md animate-slide-up"
      >
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-tertiary-container">
          <Icon name="task_alt" size={36} fill />
        </div>
        <span className="px-space-md py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
          Submitted &amp; Encrypted
        </span>
        <h3 id="success-title" className="font-headline-lg text-headline-lg text-on-surface">
          Thank you! Your feedback is recorded.
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your evaluation for <strong className="text-on-surface">{result.course_name}</strong> has been
          queued for institutional analytics.
        </p>

        <div className="w-full bg-surface-container-low rounded-xl p-space-md text-left flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex justify-between gap-4">
            <span>Sentiment classified as:</span>
            <span className="text-on-surface font-semibold capitalize">{result.sentiment_label}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Identity exposure:</span>
            <span className="text-on-tertiary-container font-semibold">
              {result.is_anonymous ? 'Zero-Knowledge Masked' : 'Attributed'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-space-sm w-full pt-space-xs">
          <button type="button" onClick={onAnother} className="btn-secondary flex-1">
            Evaluate Another
          </button>
          <Link to="/dashboard" className="btn-primary flex-1">
            Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubmitFeedback() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [courseVerified, setCourseVerified] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(false);

  // Restore any locally saved draft. The verification badge is re-derived from
  // the stored code rather than trusted from the draft payload.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;

      const draft = { ...EMPTY_FORM, ...JSON.parse(raw) };

      // Backfill the code for drafts saved before the field existed.
      if (!draft.course_code && draft.course_name) {
        const match = COURSES.find((course) => course.value === draft.course_name || course.label === draft.course_name);
        if (match) draft.course_code = match.value;
      }

      setForm(draft);
      setCourseVerified(Boolean(draft.course_code));
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  const update = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Selecting a registered section syncs department + lecturer.
  const handleCourseChange = (event) => {
    const course = COURSES.find((c) => c.value === event.target.value);
    setForm((prev) => ({
      ...prev,
      course_code: course ? course.value : '',
      course_name: course ? course.label : '',
      department: course ? course.department : prev.department,
      faculty_name: course ? course.faculty : prev.faculty_name,
    }));
    setCourseVerified(Boolean(course));
    setErrors((prev) => ({ ...prev, course_name: undefined, course_code: undefined }));
  };

  const charCount = form.comment.length;

  const showToast = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 3200);
  };

  const saveDraft = () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    showToast();
  };

  const validate = () => {
    const next = {};
    if (!form.course_code || !form.course_name) next.course_name = 'Select an enrolled course.';
    if (!form.department) next.department = 'Select a department.';
    if (!form.faculty_name.trim()) next.faculty_name = 'Enter the course instructor.';
    if (!form.category) next.category = 'Choose an evaluation facet.';
    if (form.rating === 0) next.rating = 'Please select a star rating before proceeding.';
    if (form.comment.trim().length < 10) next.comment = 'Please provide at least a sentence of feedback.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!validate()) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        // The design's form has no identity field, so attribution is never sent.
        student_name: null,
        course_name: form.course_name,
        department: form.department,
        faculty_name: form.faculty_name.trim(),
        category: form.category,
        rating: form.rating,
        comment: form.comment.trim(),
        is_anonymous: form.is_anonymous,
      };

      const saved = await submitFeedbackData(payload);
      sessionStorage.removeItem(DRAFT_KEY);
      setResult(saved);
    } catch (error) {
      setErrors({ submit: error.message || 'Could not submit your feedback. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setForm(EMPTY_FORM);
    setCourseVerified(false);
    setErrors({});
  };

  const ratingMeta = RATING_LABELS[form.rating];

  return (
    <div className="relative w-full py-space-xl px-margin flex items-center justify-center">
      <div className="absolute -top-12 -left-20 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 flex flex-col gap-space-lg">
        {/* Stepper */}
        <div className="card rounded-xl p-space-lg flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-primary-container font-headline-sm text-headline-sm">
                2
              </span>
              <div>
                <p className="overline text-on-surface-variant">Academic Assessment Cycle</p>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Step 2 of 3: Course &amp; Faculty Evaluation
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md bg-surface-container-low px-space-md py-1 rounded-full">
              <Icon name="schedule" size={16} className="text-secondary" />
              <span>Takes ~2 mins</span>
            </div>
          </div>

          <div className="space-y-space-xs">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-700 ease-out" style={{ width: '66%' }} />
            </div>
            <div className="flex justify-between items-center font-label-sm text-label-sm text-on-surface-variant">
              <span>Core Demographics (Done)</span>
              <span className="font-headline-sm text-secondary">66% Completed</span>
              <span>Submission &amp; Receipt</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card rounded-xl shadow-e2 p-space-lg md:p-space-xl flex flex-col gap-space-lg">
          {/* Privacy notice */}
          <div className="bg-surface-container-low p-space-md rounded-lg flex items-start gap-space-md">
            <div className="p-space-xs bg-surface-container-highest rounded-md text-secondary shrink-0">
              <Icon name="verified_user" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">Institutional Privacy Standard</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Evaluations inform curricular refinement and faculty reviews. All textual sentiments
                undergo automatic token masking to eliminate unintended identifying markers.
              </p>
            </div>
          </div>

          {errors.submit && (
            <div role="alert" className="p-space-md rounded-lg bg-error-container text-on-error-container flex items-start gap-space-sm">
              <Icon name="error" size={20} />
              <span className="font-body-sm text-body-sm">{errors.submit}</span>
            </div>
          )}

          {/* Section 1: course identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <FieldLabel htmlFor="course-select" hint="Select the registered semester section">
                <span>
                  Course Name <span className="text-error">*</span>
                </span>
              </FieldLabel>
              {courseVerified && (
                <span className="text-on-tertiary-container flex items-center gap-1 font-label-sm text-label-sm">
                  <Icon name="check_circle" size={14} />
                  Verified
                </span>
              )}
              {errors.course_name && (
                <span className="text-error font-body-sm text-body-sm" role="alert">
                  {errors.course_name}
                </span>
              )}
              <div className="relative mt-1">
                <select
                  id="course-select"
                  className="field"
                  value={form.course_code}
                  onChange={handleCourseChange}
                  aria-invalid={Boolean(errors.course_name)}
                >
                  <option value="" disabled>
                    Select an enrolled course...
                  </option>
                  {COURSES.map((course) => (
                    <option key={course.value} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" size={20} className="select-chevron" />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <FieldLabel htmlFor="dept-select" hint="Parent academic school or faculty">
                <span>
                  Academic Department <span className="text-error">*</span>
                </span>
              </FieldLabel>
              {errors.department && (
                <span className="text-error font-body-sm text-body-sm" role="alert">
                  {errors.department}
                </span>
              )}
              <div className="relative mt-1">
                <select
                  id="dept-select"
                  className="field"
                  value={form.department}
                  onChange={update('department')}
                  aria-invalid={Boolean(errors.department)}
                >
                  <option value="" disabled>
                    Select department...
                  </option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" size={20} className="select-chevron" />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <FieldLabel htmlFor="instructor-input" hint="Primary lecturer or section chair">
                <span>
                  Faculty / Instructor Name <span className="text-error">*</span>
                </span>
              </FieldLabel>
              {errors.faculty_name && (
                <span className="text-error font-body-sm text-body-sm" role="alert">
                  {errors.faculty_name}
                </span>
              )}
              <div className="relative flex items-center mt-1">
                <input
                  id="instructor-input"
                  className="field pl-space-md pr-10"
                  placeholder="e.g. Dr. Alan Turing"
                  value={form.faculty_name}
                  onChange={update('faculty_name')}
                  aria-invalid={Boolean(errors.faculty_name)}
                />
                <Icon name="school" size={20} className="absolute right-3 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <FieldLabel htmlFor="category-select" hint="Focal area for algorithmic categorisation">
                <span>
                  Feedback Category <span className="text-error">*</span>
                </span>
              </FieldLabel>
              {errors.category && (
                <span className="text-error font-body-sm text-body-sm" role="alert">
                  {errors.category}
                </span>
              )}
              <div className="relative mt-1">
                <select
                  id="category-select"
                  className="field"
                  value={form.category}
                  onChange={update('category')}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    Choose evaluation facet...
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Icon name="expand_more" size={20} className="select-chevron" />
              </div>
            </div>
          </div>

          {/* Section 2: rating */}
          <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col items-center md:items-start gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-space-xs">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Overall Experience Rating <span className="text-error">*</span>
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Holistic benchmark for this course semester
                </p>
              </div>
              <div className="px-space-md py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md self-start sm:self-auto">
                {ratingMeta ? ratingMeta.badge : 'Select rating'}
              </div>
            </div>

            <RatingInput value={form.rating} onChange={(value) => { setForm((p) => ({ ...p, rating: value })); setErrors((p) => ({ ...p, rating: undefined })); }} />

            <p
              className={`font-body-md text-body-md font-headline-sm min-h-[24px] ${
                errors.rating ? 'text-error' : 'text-secondary'
              }`}
              role={errors.rating ? 'alert' : undefined}
            >
              {errors.rating ?? (ratingMeta ? ratingMeta.text : 'Click a star to assign cumulative score')}
            </p>
          </div>

          {/* Section 3: anonymity */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-e1 flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
                <Icon name="shield" size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Anonymous Submission</span>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm">
                    High Privacy
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Your student ID, university email and session tokens are detached from this record.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <span className="sr-only">Submit anonymously</span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.is_anonymous}
                onChange={(e) => setForm((p) => ({ ...p, is_anonymous: e.target.checked }))}
              />
              <div className="w-12 h-6 bg-surface-container-highest peer-checked:bg-secondary rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-secondary relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          {/* Section 4: verbatim */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex justify-between items-end">
              <label htmlFor="feedback-body" className="font-headline-sm text-headline-sm text-on-surface">
                Your Detailed Feedback <span className="text-error">*</span>
              </label>
              <span className={`font-label-md text-label-md ${charCount > 900 ? 'text-error' : 'text-on-surface-variant'}`}>
                {charCount} / {COMMENT_MAX_LENGTH}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Prompt suggestions: What did the instructor do best? What can be improved regarding
              coursework, laboratory pacing, office hours or textbook clarity?
            </p>
            {errors.comment && (
              <span className="text-error font-body-sm text-body-sm" role="alert">
                {errors.comment}
              </span>
            )}
            <textarea
              id="feedback-body"
              rows={6}
              maxLength={COMMENT_MAX_LENGTH}
              className="field p-space-md resize-y h-auto"
              placeholder="Provide concrete examples. For instance: 'Lectures on dynamic programming were well-structured, but assignment 3 deadlines collided with the mid-term revision week...'"
              value={form.comment}
              onChange={update('comment')}
              aria-invalid={Boolean(errors.comment)}
            />
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mt-1">
              <Icon name="info" size={15} className="text-secondary" />
              <span>
                Sentiment is classified by a{' '}
                {isSupabaseConfigured ? 'database trigger' : 'client-side'} rule engine.
              </span>
            </div>
          </div>

          {/* Action bar */}
          <div className="pt-space-md flex flex-col-reverse sm:flex-row items-center justify-between gap-space-md">
            <button type="button" onClick={saveDraft} className="btn-secondary w-full sm:w-auto">
              <Icon name="bookmark_border" size={18} />
              Save Draft
            </button>
            <div className="flex items-center gap-space-sm w-full sm:w-auto">
              <Link to="/" className="btn-ghost hidden sm:inline-flex">
                Cancel
              </Link>
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                {submitting ? 'Submitting…' : 'Submit Feedback'}
                <Icon name="send" size={18} />
              </button>
            </div>
          </div>
        </form>

        <div className="text-center font-body-sm text-body-sm text-on-surface-variant pb-space-lg">
          Questions regarding evaluation cadence? Review the{' '}
          <Link to="/submit" className="text-secondary hover:underline font-headline-sm">
            Course Evaluation Rubric
          </Link>{' '}
          or consult your Faculty Academic Council representative.
        </div>
      </div>

      <SuccessModal result={result} onAnother={resetForm} />

      {/* Draft toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-space-lg py-space-md rounded-xl shadow-e4 flex items-center gap-space-md transition-all duration-300 ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <Icon name="check_circle" size={22} className="text-tertiary-fixed" fill />
        <div>
          <p className="font-headline-sm text-headline-sm">Draft Saved Locally</p>
          <p className="font-body-sm text-body-sm opacity-80">
            You can return anytime this active session to complete.
          </p>
        </div>
      </div>
    </div>
  );
}