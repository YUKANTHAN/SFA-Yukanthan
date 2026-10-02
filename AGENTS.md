# AGENTS.md

Working notes for coding agents on this repository. Read `RULES.md` first — it
holds the invariants. This file covers orientation and gotchas.

## Orientation

Two deployables, one repository.

| | Path | Runtime |
|---|---|---|
| Frontend | `src/` | Vite dev server on :5173, proxies `/api` → :8000 |
| Backend | `backend/` | uvicorn on :8000 |
| Database | Supabase Postgres | Applied via `supabase_schema.sql` or migration 02 |

Read in this order: `RULES.md` → `docs/ARCHITECTURE.md` → the code.

## Commands

```bash
npm run dev                       # frontend, :5173
npm run build                     # type/bundle gate
npm run lint                      # oxlint
npm test                          # node --test, aggregation units (no DOM)

cd backend
uvicorn app.main:app --reload --port 8000
pytest tests -q                   # no database or network needed
python scripts/seed_demo.py       # demo corpus via the API
```

## Gotchas

**The envelope is load-bearing.** Collection reads return
`{ items, total, degraded, notice }`. If you see a reader doing
`result.items` and a fetcher returning a bare array, you have reintroduced the
original bug. The readers are in `src/pages/Dashboard.jsx` and
`FeedbackDetails.jsx`; the shape is declared in `backend/app/schemas.py`.

**`feedback_themes` has no trigger.** Python writes theme rows explicitly. If
you leave or re-add the `AFTER INSERT` trigger, every theme double-inserts.

**`student_name` is accepted then dropped.** Do not "fix" this by removing the
field from `FeedbackCreate` — the field exists so a client sending a name gets a
`201`, not a confusing `422`. It is discarded in `routers/feedback.py`.

**`require_auth_on_reads` is not the same as "no auth".** When false, anonymous
reads are allowed and `current_admin` is not consulted. Default is `true`; never
lower it for a deployment.

**`db.admin_client()` falls back to the anon key.** That fallback logs a warning
on every call. If you see repeated warnings, set
`SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

**There is no public INSERT policy on `feedback`.** Writes go through
`db.admin_client()`. Using `get_anon_client()` to write fails `42501`, and
bypassing Pydantic that way would also skip the `student_name` strip.

**`create_client(options=...)` takes `SyncClientOptions`, not a dict.** The
JavaScript-shaped `{"global": {"headers": ...}}` looks right and raises
`AttributeError: 'dict' object has no attribute 'headers'`, which the auth
route reports as a 401. The test suite cannot catch this — its fake client
never builds a real one.

**`RATE` limiting is per-process.** N workers means N× the limit. Do not scale
out without replacing `RateLimiter`.

**The dashboard's poll is visibility-gated.** `document.visibilityState` must be
`'visible'` or the 20-second timer does nothing. This is deliberate.

**`Backend tests patch `app.db`.** They never touch the network. Do not write a
test that needs a live Supabase project — write a script instead.

## Style

- Python: 4-space indent, type hints on public functions, no `print` outside
  scripts, `logging` rather than `print` in the app.
- JavaScript: single quotes, semicolons, 2-space indent, named exports for
  helpers, default export for components.
- Tailwind classes come from the theme in `src/index.css`, which encodes
  `docs/DESIGN.md`. No inline hex values in components.
- No comments that restate the code. Comment the *why*, especially where a
  choice looks wrong without its history — much of `src/lib/api.js` and
  `backend/app/analysis.py` is that kind of comment.

## Verifying a change

Beyond lint and build, the behaviour that actually regressed once:

1. Submit feedback → open Analytics → the row is present, unrefreshed.
2. Stop the backend → every surface shows a specific error, no sample data.
3. `grep -riE "supabase\.co|GoTrueClient|SupabaseClient|eyJ[A-Za-z0-9_-]{10,}" dist/assets/` → nothing. The bare word `supabase` still appears in the health badge's setup hint; that is expected.
4. `pytest backend/tests -q` → passes offline.

## Known gaps

Tracked in `docs/TASKS.md` under **Accepted risks** and **Deferred**. The
backend suite passes (44 tests) as of 2026-10-02 on the project venv
(`backend/.venv`, Python 3.13.5) and against the live Supabase project. Still
never assume "it imports" means "it was tested" — the first run of the suite
surfaced a defect that stopped the app from importing at all, and only running
the migration against the real database surfaced three more that neither review
nor the fake PostgREST could see.
