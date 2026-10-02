# Tasks

Legend: `[x]` done · `[ ]` open · `[-]` deliberately not doing

---

## P0 — Fix submitted feedback not reaching the dashboard

- [x] Identify the contract mismatch: `fetchFeedbackList()` returned an array, `Dashboard.jsx` read `.items`
- [x] Introduce `src/lib/api.js` as the single network module
- [x] Declare the collection envelope in the API (`FeedbackListOut`, `ThemeListOut`)
- [x] Fix the read in `Dashboard.jsx` and `FeedbackDetails.jsx`
- [x] Surface read failures instead of rendering empty state
- [x] Stop swallowing write errors; `502` reaches the form
- [x] Remove the hardcoded `INITIAL_DEMO_FEEDBACK` store and its shared-mutable-array bug
- [x] Add a regression test: submit, then read, and assert the new id is present
- [x] Make the dashboard refresh on submission without operator action

## P1 — Python backend

- [x] FastAPI app with CORS, lifespan logging, typed error handler
- [x] `config.py` from env, with an explicit list of what is missing
- [x] `analysis.py` — sentiment scoring and theme extraction, pure
- [x] `db.py` — anon client, admin client, admin client fallback + warning
- [x] `security.py` — JWT verification, `profiles.role` gate, per-IP throttle
- [x] `routers/health.py` — reports misconfigured / degraded instead of raising
- [x] `routers/auth.py` — login, me, logout
- [x] Role is resolved once, in `resolve_principal`, and reused by `/api/auth/login`
      so a valid non-admin account is refused at sign-in rather than at first read
- [x] `routers/feedback.py` — create, list, themes, get, delete
- [x] Theme rows are written with the service-role client; `feedback_themes` has no
      anon insert policy, so the anon client was failing every insert silently
- [x] Submissions write with the service-role client too, not the anon client. The live
      project's insert policy rejected the anon write with `42501`, and the anon key is
      public (it is in git history), so a public `INSERT` policy was a liability anyway
- [x] `get_anon_client(token=...)` builds a `SyncClientOptions`, not a dict. Passing a
      dict made every protected read raise `'dict' object has no attribute 'headers'`,
      which surfaced as a bogus 401 on valid sessions
- [x] `fetchFeedbackList` / `fetchFeedbackThemes` reject a non-envelope response, so
      a writer/reader shape mismatch fails loudly instead of rendering zeros
- [x] N+1 avoided: themes fetched in one query, grouped in Python
- [x] Pydantic validation mirroring the form constraints
- [x] `requirements.txt` / `requirements-dev.txt` / `.env.example`
- [x] `scripts/seed_demo.py` — seeds through the API so analysis runs

## P1 — Database

- [x] Add `course_code` to `feedback`
- [x] Drop the sentiment and theme triggers; API owns analysis
- [x] Make `sentiment_*` `NOT NULL`
- [x] Tighten `SELECT` to admin-only on `feedback` and `feedback_themes`
- [x] Revoke public `INSERT` on `feedback_themes`
- [x] Remove the public `INSERT` policy on `feedback` entirely - the anon key is public,
      so it let anyone bypass Pydantic and the `student_name` strip
- [x] New signups default to `student`, not `admin`
- [x] Indexes for `created_at DESC`, sentiment, course, theme joins
- [x] Write idempotent migration 02 for existing projects
- [x] Remove the SQL seed block (it would have produced 100% neutral rows)

## P1 — Frontend integration

- [x] Vite `/api` proxy for dev and preview
- [x] `.env.example` rewritten; no credentials
- [x] `useAdminSession` resolves the token server-side, fails closed
- [x] Cross-tab sign-out sync
- [x] Distinguish "not signed in" from "API unreachable"
- [x] `ApiStatusBadge` replaces `SupabaseStatusBadge`
- [x] Remove `@supabase/supabase-js`; the bundle carries no project URL, key or SDK
- [x] Wire `/success` receipt to the real stored record

## P2 — Quality

- [x] `backend/tests/test_analysis.py` — sentiment and theme units
- [x] `backend/tests/test_api.py` — route contracts against a fake PostgREST
- [x] `npm run lint` clean of errors
- [x] `npm run build` succeeds
- [x] **Backend suite runs: 44 passed.** Confirmed against the exact pins in
      `requirements.txt`. Running it caught two bugs that review had missed —
      see "What running it found" below.

## Cleanup performed

- [x] `src/lib/supabase.js` — replaced by `src/lib/api.js`
- [x] `src/lib/sentiment.js` — superseded by `backend/app/analysis.py`
- [x] `src/components/SupabaseStatusBadge.jsx` — replaced by `ApiStatusBadge`
- [x] `.env.local` — live anon key out of the frontend tree
- [x] `dist/` — 694 KB of regenerable build output
- [x] `stitch_student_feedback_analyzer.zip` — 8 MB duplicate
- [x] `stitch_student_feedback_analyzer/` — 6 mockup folders; `DESIGN.md` preserved at `docs/DESIGN.md`
- [x] `.kilo/worktrees/serene-derby/` — stale full-repo duplicate
- [x] `README.md` — replaced the Vite template boilerplate

## Not doing

- [-] Real NLP sentiment. Lexicon scoring is directional; the dashboard footer says so.
- [-] Server-side aggregation endpoint. Would be a second implementation of `summarize()`. See `MEMORY.md`.
- [-] Supabase session revocation on logout. `/api/auth/logout` does not hold the user's credentials.
- [-] SSO / Google Workspace sign-in. Buttons exist in the design and stay disabled.

## What running it found

Writing the code was not verification. Two defects only appeared once the suite
could import the app:

- **The app could not start at all.** Both 204 endpoints were declared as
  `@router.post("/logout", ...)` / `@router.delete(...)` with a `-> None`
  return annotation. FastAPI reads that annotation as a *response model*, and
  204 forbids a body, so `APIRoute.__init__` raised at import time — meaning
  `main.py` failed to import and every route was dead. Fixed with an explicit
  `response_model=None` on both.
- **`/api/health` was registered at `/health`.** The health router had no
  prefix while the other two did, so the frontend's `${API_BASE}/health` 404'd
  and the status badge would have read "API unreachable" permanently. The
  prefix was added to match.

Neither was reachable by reading the code. Both would have been found in the
first minute of any manual run, and the second is exactly the symptom this
whole exercise was about — a UI reporting a state that the backend never had.

Running against the **live project** found three more, none of which the fake
PostgREST in the test suite could surface:

- **Every protected read 401'd on a valid session.** `get_anon_client(token=...)`
  passed `{"global": {"headers": ...}}` to `create_client`. `supabase-py` 2.x
  calls `options.headers.update(...)`, so a dict raised
  `AttributeError: 'dict' object has no attribute 'headers'` and the route
  converted that into a 401. Correct-looking, wrong — the shape only works in
  JavaScript. The suite passed because the fake client never builds a real one.
- **Submissions failed `42501` on the live project**, because the write path used
  the anon client against a policy that does not permit it. Writes moved to
  `db.admin_client()`; the browser has no Supabase SDK to write with anyway.
- **One submission produced 8 theme rows.** Python writes 4; the legacy
  `feedback_theme_trigger` still installed on the database wrote 4 more. This is
  the trigger half of migration 02, confirmed by reading the rows back, and it
  inflates every theme count on the dashboard.

Also worth noting: the login handler read `access_token` off the top level of the
auth response. `supabase-py` nests it at `response.session.access_token`, so the
token was `None` and `resolve_principal` had nothing to verify.
## Accepted risks

- [x] **The service-role key and admin password are left as-is.** Both were shared
      in chat while debugging and should be rotated on principle, but the owner
      reviewed this on 2026-10-02 and decided the credentials stand. They are
      scoped to this Supabase project's own data and live only in the gitignored
      `backend/.env`. If the project ever becomes public-facing, or the anon key
      is ever rotated, rotate both at the same time.

## Open

Nothing outstanding.

## Verified live, end to end

Against the real project on 2026-10-02, after running migration 02:

- `GET /api/health` reports `database: connected`.
- Admin login returns a session with `role=admin`; `/api/auth/me` resolves it.
- `/api/feedback` returns the 16-row corpus in a `{items, total, degraded}`
  envelope with `degraded=false`. An anonymous read returns `401` from the API and
  zero rows at the database.
- A submission returns `201` with `course_code` persisted, appears first in the
  feed unrefreshed, and `DELETE` returns `204` and restores the count.
- The public anon key can no longer insert (`42501`) and sees zero rows on both
  corpus tables. The API is the only writer.
- One submission now writes exactly 4 theme rows, not 8. `feedback_theme_trigger`
  is gone, so Python owns analysis outright.

The submit → dashboard path, which was the original complaint, works.

## What the migration itself got wrong

Three defects, all found by running it rather than reading it, and all of the
same kind: the script assumed names and catalog columns it had not checked.

- **42710 on re-run.** It created `"Admins can view feedback themes"` without
  dropping it first; `CREATE POLICY` has no `IF NOT EXISTS`. Fixed by dropping
  *every* policy on `feedback` and `feedback_themes` via a `pg_policies` loop
  rather than by assumed name. That also closes the real hole the named version
  had: a permissive policy under an unknown name survived it.
- **42703, twice.** The verification query used `pg_trigger.conname`, which is a
  `pg_constraint` column; the trigger column is `tgname`.
- **Diagnostics could roll back the migration.** Both failures above were in the
  read-only section, and the SQL Editor runs the script as one transaction, so
  each one discarded the entire schema change — twice leaving the database
  exactly as it was. The migration is now wrapped in an explicit
  `begin;` / `commit;` with the verification queries deliberately outside it.

Worth stating plainly: all three were invisible to review and to the test suite,
because neither can execute SQL. The migration was only ever going to be proven
by running it against the real project.

## Deferred

- [ ] Replace the per-process `RateLimiter` with a shared counter before running more than one worker.
- [ ] Add ETag / `If-None-Match` on `/api/feedback` keyed on `max(created_at)`.
- [ ] Page beyond 2,000 rows; port `summarize()` to Python rather than reimplementing it.
- [x] Frontend unit tests for the aggregation layer. `npm test` runs 19 cases
      through Node's built-in runner against `src/lib/analytics.js` — no
      framework, no DOM. This is the code that produced the original defect, so
      it is the part worth pinning arithmetically.
- [ ] Frontend *component* tests (rendering, user interaction). Still no DOM
      harness; `oxlint` and `vite build` remain the gate for `src/**/*.jsx`.
