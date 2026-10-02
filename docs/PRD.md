# Product Requirements Document — EduPulse Analytics

Status: shipped (v1.0) · Last updated: 2026-10-02

---

## 1. Problem

Students submit course and faculty feedback through a web form. Academic
leadership needs to see what is being said across the institution — how
sentiment is trending, which themes recur, which ratings are falling.

The system as received did not do this. Feedback was written from the browser
directly into Supabase, and the read path was disconnected from the write path,
so submissions were reported as successful while the dashboard rendered zeros.
The failure was invisible to everyone using it.

## 2. Root cause (the thing that actually had to be fixed)

A contract mismatch, silently absorbed:

- `src/lib/supabase.js` → `fetchFeedbackList()` returned a **bare array**.
- `src/pages/Dashboard.jsx` and `FeedbackDetails.jsx` read **`result.items`**,
  `.degraded`, `.notice` — an envelope shape that no reader produced.

`result.items` was therefore `undefined`, `attachThemes(undefined)` coerced to
`[]`, and `summarize([])` produced `total: 0`. Every stat card, chart and table
rendered an empty state while the database held real rows. No exception, no
console error, no failed request.

Three contributors made it durable rather than accidental:

1. **Errors were swallowed on write.** `submitFeedbackData` caught a failed
   Supabase insert and downgraded it to `console.warn`, then returned a locally
   constructed object. The student always saw "Thank you!".
2. **Two sources of truth.** Every submission was written to both Supabase and
   a `localStorage` array seeded with eight hardcoded demo rows. Readers merged
   them by hand, with an id-prefix heuristic.
3. **A shared mutable fixture.** `getLocalFeedback()` returned the module-level
   `INITIAL_DEMO_FEEDBACK` array itself; `submitFeedbackData` then called
   `.unshift()` on it, permanently mutating the seed for the rest of the session.

## 3. Users

| Persona | Need | Route |
|---|---|---|
| Student | Submit honest, anonymous feedback on a course and instructor | `/submit` |
| Student | Confirm the submission landed, and see what was recorded | `/success` |
| Faculty administrator | See campus-wide sentiment, ratings and themes at a glance | `/dashboard` |
| Faculty administrator | Filter the corpus, read verbatim evidence, export CSV | `/details` |
| Academic IT | Deploy, configure and diagnose the system | — |

## 4. Requirements

### Functional

| ID | Requirement | Status |
|---|---|---|
| F1 | A student submits course, department, faculty, category, 1–5 rating, and a comment of ≥10 characters | done |
| F2 | A submission is stored anonymously; `student_name` is never persisted | done |
| F3 | Sentiment (`positive` / `neutral` / `negative`) and a score are computed server-side at write time and stored with the row | done |
| F4 | Recurring praise and issue themes are extracted server-side and stored per feedback record | done |
| F5 | A confirmed submission is immediately visible to an authenticated administrator | done |
| F6 | Only accounts with `profiles.role = 'admin'` can read the corpus | done |
| F7 | The dashboard aggregates total, mean rating, rating histogram, sentiment split, category averages, and top themes | done |
| F8 | The inspector filters by free text, course, category, sentiment and rating, and exports the filtered set to RFC 4180 CSV | done |
| F9 | A receipt page shows the stored record after submission | done |
| F10 | If the API is unreachable or misconfigured, the UI says so — it never substitutes sample data | done |

### Non-functional

| ID | Requirement | Rationale |
|---|---|---|
| N1 | No database credentials or SDK in the browser bundle | The anon key shipped to every visitor, and RLS was the only boundary |
| N2 | A failed write surfaces as an error to the user | Silent failure was the primary defect |
| N3 | Analysis has exactly one implementation | Three existed: JS, PL/pgSQL, and a fallback path |
| N4 | Public write endpoint is rate limited per IP | Open submission form |
| N5 | Same-origin API calls in development | Removes CORS from the critical path |
| N6 | Backend testable without a database or network | Route contracts are the highest-value tests |

### Explicitly out of scope

- Real NLP / model-based sentiment. The lexicon scorer is directional, and the
  UI states this in the dashboard footer.
- Student accounts. Submission is anonymous and unauthenticated by design.
- Institutional SSO and Google Workspace sign-in. The buttons exist and are
  `disabled` in the design; they are not wired to a provider.
- Multi-tenant institutions. Single campus.
- Feedback editing by students after submission.

## 5. Success criteria

1. A submission followed by an administrator opening `/dashboard` shows the new
   row, its rating, and its sentiment — without a manual refresh.
2. Stopping the backend produces a visible, specific error on every surface.
3. `student_name` is `null` for every row regardless of what a client sends.
4. No Supabase key or URL appears in the built bundle.
5. `backend/tests` passes with no database and no network.

## 6. Constraints accepted

- The rate limiter is per-process. Multiple uvicorn workers each hold their own
  counter, so the effective limit scales with worker count. See
  `docs/ARCHITECTURE.md` § Scaling.
- Logout is client-side token disposal. Supabase refresh tokens are not revoked
  server-side, because `/api/auth/logout` does not hold the user's credentials.
- Aggregation runs in the browser over the rows it already fetched for the
  table, so there is one implementation rather than two that can disagree. This
  caps a single read at 2,000 rows; see `docs/TASKS.md`.

## 7. Related documents

- `ARCHITECTURE.md` — components, request flows, data model, failure modes
- `DESIGN.md` — the Material-derived design system the UI implements
- `TASKS.md` — status board
- `MEMORY.md` — decisions and their reasons, so they are not relitigated
- `../RULES.md` — the invariants any contributor must not break
