# EduPulse Analytics

Institutional student-feedback analytics. Students submit anonymous course and
faculty evaluations; administrators read an aggregated sentiment dashboard and a
filterable verbatim corpus.

React 19 + Vite frontend, FastAPI backend, Supabase Postgres.

## Documentation

| Document | Read it for |
|---|---|
| [docs/PRD.md](docs/PRD.md) | What the system does, and the root cause of the original defect |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components, request flows, data model, failure modes, scaling limits |
| [docs/DESIGN.md](docs/DESIGN.md) | The design system the UI implements |
| [docs/TASKS.md](docs/TASKS.md) | Status board, open work, what is deliberately not being done |
| [docs/MEMORY.md](docs/MEMORY.md) | Decisions and their reasons, so they are not relitigated |
| [RULES.md](RULES.md) | Invariants — read before changing data flow |
| [AGENTS.md](AGENTS.md) | Orientation and gotchas for coding agents |

## Stack

**Frontend** — React 19, Vite 8, React Router 7, Tailwind CSS 4, canvas-confetti,
oxlint. No database SDK.

**Backend** — Python 3.11+, FastAPI, Uvicorn, Pydantic 2, `supabase-py`. No ORM;
the API speaks PostgREST to Supabase.

**Database** — Supabase Postgres with row-level security. Schema in
`supabase_schema.sql`, migration for existing projects in
`supabase_migration_02_analysis_ownership.sql`.

The browser holds no database credentials and no data-fallback logic. It either
gets authoritative data from the API or it shows an error.

## Setup

### 1. Database

For a **new** Supabase project, run `supabase_schema.sql` in the SQL Editor.

For an **existing** project created with the old schema, run
`supabase_migration_02_analysis_ownership.sql` instead. It is idempotent and
preserves your data. It drops the analysis triggers (the API now owns them),
adds `course_code`, and revokes public reads of the corpus.

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows; `source .venv/bin/activate` elsewhere
pip install -r requirements.txt
copy .env.example .env             # set SUPABASE_URL and SUPABASE_ANON_KEY
uvicorn app.main:app --reload --port 8000
```

Also set `SUPABASE_SERVICE_ROLE_KEY`. Reads use it to bypass RLS, and writes
require it: the API is the only writer and the anon key is rejected by policy.

### 3. Frontend

```bash
npm install
npm run dev                       # http://localhost:5173
```

`vite.config.js` proxies `/api` to `http://127.0.0.1:8000`, so there is no CORS
preflight in development.

### 4. Admin account

There is no demo login. Create a user under Supabase → Authentication, then
promote it:

```sql
update public.profiles set role = 'admin' where id = '<auth user id>';
```

New signups default to `student`.

### 5. Optional: demo corpus

```bash
python backend/scripts/seed_demo.py
```

Posts nine representative submissions through the API so the sentiment analyser
runs — seeding by SQL would leave every row labelled `neutral`.

## Verification

```bash
npm run lint
npm test                  # 19 aggregation cases, Node's built-in runner
npm run build
cd backend && pytest tests -q     # no database or network required
```

Status as of 2026-10-02: lint clean of errors, build succeeds, **41 backend
tests and 19 frontend aggregation tests pass**. The suite has never been run
against a live Supabase project, so the end-to-end round-trip below is still
unproven.

Then check the behaviour that actually regressed:

1. Submit feedback, open `/dashboard`. The new row is present without a refresh.
2. Stop the backend. Every surface shows a specific error; none shows sample data.
3. `grep -riE "supabase\.co|GoTrueClient|SupabaseClient|eyJ[A-Za-z0-9_-]{10,}" dist/assets/` returns nothing — no project URL, no SDK, no JWT. The word "supabase" does appear: the health badge names `supabase_schema.sql` as the setup step.