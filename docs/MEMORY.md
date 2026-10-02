# Memory — decisions and why

A record of choices that are not obvious from the code, so they are not
relitigated. Newest first.

---

## 2026-10-02 — Backend moved to Python; browser data access removed

**Decision.** The React app no longer talks to Supabase. A FastAPI service in
`backend/` owns all database access, sentiment scoring and theme extraction.

**Why.** Three problems, one root.

The reported symptom — submitted feedback not appearing on the dashboard — was
a contract mismatch: `fetchFeedbackList()` returned a bare array while
`Dashboard.jsx` read `result.items`. `undefined` in, `[]` out, and every chart
rendered zero with no error. That bug could not have been found by testing the
writer and the reader separately, because both were individually correct.

The architecture made it invisible. A failed insert was caught and reduced to
`console.warn` while the user saw "Thank you!". Every row went to both Supabase
and a `localStorage` array seeded with eight hardcoded demo rows, merged on read
by an id-prefix heuristic. The seed array itself was returned by reference and
then mutated with `.unshift()`.

**Alternatives rejected.** Keeping Supabase in the browser and fixing the
envelope alone: fixes the crash, leaves the swallowed write error, the dual
write, the shared mutable seed, and the anon key in the bundle. Not a fix, a
patch.

---

## 2026-10-02 — No fallback dataset in the client

**Decision.** If the API cannot answer, the UI shows an error. There is no
sample corpus.

**Why.** The eight hardcoded `INITIAL_DEMO_FEEDBACK` rows were seeded into
`localStorage` on first read and silently substituted for real data. They made
every failure mode look like a working app with an empty result.

**Consequence.** A blank dashboard now always has a reason attached.

---

## 2026-10-02 — Envelope is a declared response model

**Decision.** Collection reads return `{ items, total, degraded, notice }`,
declared as Pydantic models (`FeedbackListOut`, `ThemeListOut`) rather than
returned ad hoc.

**Why.** The original bug was a shape mismatch between two files that both
looked correct. Declaring the shape makes a mismatch loud — it fails at the
boundary and shows up in the OpenAPI schema — instead of producing `undefined`
three layers later.

---

## 2026-10-02 — No server-side aggregation endpoint

**Decision.** `/api/stats` was designed and then deliberately not built.
`summarize()` in `src/lib/analytics.js` remains the only aggregation
implementation.

**Why.** A Python aggregation endpoint would have been a second implementation
of the same rules — exactly the drift that produced the sentiment-label
disagreement between the JS and PL/pgSQL versions. One implementation, fed by
one endpoint, cannot disagree with itself.

**Cost.** A single read is capped at 2,000 rows. Acceptable for a single campus.
Tracked in `TASKS.md`; when it is lifted, `summarize()` should be ported, not
reimplemented.

---

## 2026-10-02 — Database analysis triggers dropped

**Decision.** The `analyze_feedback_sentiment` and `extract_feedback_themes`
triggers are removed. Python writes `sentiment_*` and `feedback_themes`.

**Why.** Three copies of the same lexicon. The browser could write a label that
differed from what the trigger computed, and the theme trigger would
double-insert once Python also wrote themes.

**Migration.** `supabase_migration_02_analysis_ownership.sql`, idempotent,
data-preserving. Trigger functions are left in place, unused, so a revert is
possible.

---

## 2026-10-02 — Hardcoded admin bypass removed

**Decision.** `admin@college.edu / admin123` is gone from the client bundle.

**Why.** Credentials for the entire corpus were shipped to every visitor in
plaintext. Login is now Supabase Auth via the API, with the `profiles.role`
check server-side.

**Consequence.** There is no demo login button. To get an admin, create a user
in Supabase Auth and run:

```sql
update public.profiles set role = 'admin' where id = '<auth user id>';
```

New signups default to `student`. The original trigger defaulted them to `admin`,
which made every self-registered account an administrator.

---

## 2026-10-02 — RLS reads made admin-only

**Decision.** `SELECT` on `feedback` and `feedback_themes` requires
`TO authenticated` with `profiles.role = 'admin'`. The previous policies were
`USING (true)` for `public`.

**Why.** The corpus holds verbatim student comments. It was readable by anyone
with the anon key, which shipped in the bundle.

**Consequence.** `SUPABASE_SERVICE_ROLE_KEY` is required for the API to read the
corpus. `db.admin_client()` falls back to the anon key with a loud warning when
it is unset, so local work continues before RLS is tightened.

---

## 2026-10-02 — Anonymity enforced, not requested

**Decision.** `student_name` is accepted on the `POST` body and then discarded.
`INSERT` policy asserts `student_name IS NULL`.

**Why.** Omitting the field from the form is a client-side courtesy. Anything
can POST directly. The guarantee has to live on the write path and in the
database constraint. `FeedbackCreate.student_name` is `str | None` rather than
`None` so a legacy client that still sends a name gets a `201` with the name
dropped, instead of a confusing `422`.

---

## 2026-10-02 — Cross-tab corpus version counter

**Decision.** A submission bumps `localStorage['edupulse_corpus_version']`; the
dashboard refetches on `storage`, `visibilitychange`, or a 20-second poll while
visible.

**Why.** The user-visible complaint was "I submitted and the dashboard did not
change". Beyond the real bug, even correct code required a manual refresh. Three
cheap signals converge on one refetch and cover submitting in another tab,
switching back, and submissions from elsewhere.

**Deliberately not WebSockets.** Polling every 20 seconds while visible is
sufficient at campus scale and adds no connection state to debug.

---

## 2026-10-02 — `/success` wired up rather than deleted

**Decision.** The receipt page was kept and made reachable.

**Why.** It was routed at `/success` but read `sessionStorage['last_submitted_feedback']`,
which nothing ever wrote — a permanently empty page. `SubmitFeedback` now writes
the API's response there, so the receipt renders authoritative stored data.

---

## Repository layout

```
backend/           FastAPI service (config, schemas, security, db, analysis, routers)
  app/             application package
  scripts/         seed_demo.py
  tests/           pytest; no database or network required
  .env.example     backend credentials template
docs/              PRD, ARCHITECTURE, DESIGN, TASKS, MEMORY
public/            static assets
src/
  components/      presentational, no network calls
  hooks/           useAdminSession
  lib/             api.js (only fetch), analytics.js (only aggregation), design.js (only constants)
  pages/           one per route
supabase_schema.sql                              fresh-project DDL
supabase_migration_02_analysis_ownership.sql      existing-project migration
RULES.md          invariants — read before changing data flow
```

**Path rule.** Only `src/lib/api.js` calls `fetch`. Only `backend/app/db.py`
imports Supabase. Only `backend/app/analysis.py` classifies sentiment. A second
place doing any of these is a bug, not a convenience.
