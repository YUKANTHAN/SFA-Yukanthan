# Architecture

```
   Browser (React 19 + Vite)                Python (FastAPI)              Supabase
   ─────────────────────────                ───────────────              ────────
   SubmitFeedback ──POST /api/feedback──▶  routers/feedback
                                            ├─ analysis.analyze_sentiment
   (no credentials, no SDK)                  ├─ analysis.extract_themes
                                            └─ db.get_anon_client ────▶  feedback
                                                                              feedback_themes
   ApiStatusBadge ───GET /api/health───▶  routers/health ─────────────▶  (SELECT 1)

   AdminLogin ──POST /api/auth/login──▶   routers/auth
                                         └─ Supabase Auth ───────────▶  auth.users
                                                                        profiles

   Navbar ──GET /api/auth/me──▶            security.require_admin
   (Bearer token)                           └─ verify JWT + profiles.role = 'admin'
   Dashboard ──GET /api/feedback───────▶  routers/feedback ───────────▶  db.admin_client
            ──GET /api/feedback/themes──▶
   FeedbackDetails ─ same two endpoints
                                            schemas.* (declared envelopes)
```

## 1. Shape: backend-for-frontend

The browser is a pure client of one HTTP API. It holds no database URL, no API
key, and no SDK. It also holds **no fallback dataset** — this is the load-bearing
decision. The previous architecture shipped eight hardcoded rows in the bundle
and silently substituted them whenever a request failed, which is precisely why
a broken read path could hide for so long.

Three layers, three jobs:

| Layer | File | Job |
|---|---|---|
| Transport | `src/lib/api.js` | The only module that calls `fetch`. Envelope in, envelope out, typed errors out. |
| Policy | `backend/app/security.py` | Who is asking, and may they read the corpus. |
| Derivation | `backend/app/analysis.py` | What the words mean. Pure, no I/O, one implementation. |

## 2. Request flows

### 2.1 Submission

```
POST /api/feedback
  ├─ throttle                  per-IP sliding window, 30/hour
  ├─ FeedbackCreate validation  rating 1..5, comment 10..1000, required fields
  ├─ analyze_sentiment()       score = positive_hits - negative_hits
  ├─ extract_themes()          ordered, de-duplicated praise/issue hits
  ├─ INSERT feedback           student_name hard-coded to NULL
  └─ INSERT feedback_themes    one row per theme hit
201 { ...record, "themes": [...] }
```

The response is the stored row, so the client renders a receipt from
authoritative data rather than from what it hoped it sent. On failure the route
raises `502` with `"Nothing was saved"`; the client shows that message and does
not clear the form or show a success modal.

### 2.2 Admin read

```
GET /api/feedback
  ├─ security.require_admin
  │    ├─ no bearer token + REQUIRE_AUTH_ON_READS=true → 401
  │    ├─ invalid/expired token                      → 401 (client drops the token)
  │    ├─ valid token, profiles.role != 'admin'      → 403
  │    └─ valid admin                                → principal
  ├─ SELECT * FROM feedback ORDER BY created_at DESC LIMIT 2000
  ├─ _enrich(): one IN(...) query for themes, grouped in Python
  └─ 200 { items: [...], total, degraded: false, notice: null }
```

`_enrich()` exists to avoid an N+1: themes for the whole page are fetched in one
query and bucketed by `feedback_id` before serialisation.

### 2.3 Freshness

Three mechanisms converge on `Dashboard.load({ silent: true })`:

1. **Cross-tab signal.** A successful submit bumps
   `localStorage['edupulse_corpus_version']`. The `storage` event fires in other
   tabs; they compare versions and refetch only if theirs is stale.
2. **`visibilitychange`.** Returning to the tab refetches, covering a submission
   made elsewhere entirely.
3. **20-second poll**, only while `document.visibilityState === 'visible'`.

A silent refresh never sets the loading flag, so charts the operator is reading
do not blank out. The version counter is the mechanism that makes
"I submitted, now I opened Analytics" work without a manual refresh — the
original defect's user-visible symptom.

## 3. Data model

### `feedback`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | server default |
| `student_name` | text | always `NULL`; anonymity is enforced, not requested |
| `course_code` | text | section code, e.g. `CS-301` |
| `course_name` | text | human label shown everywhere |
| `department` | text | |
| `faculty_name` | text | |
| `category` | text | taxonomy in `src/lib/design.js` |
| `rating` | int | `CHECK 1..5` |
| `comment` | text | verbatim, 10–1000 chars |
| `is_anonymous` | bool | |
| `sentiment_label` | text | `NOT NULL`, written by the API |
| `sentiment_score` | int | `NOT NULL`, written by the API |
| `created_at` | timestamptz | indexed `DESC` |

### `feedback_themes`
`id`, `feedback_id` (FK, `ON DELETE CASCADE`), `theme`, `theme_type`
(`praise` | `issue`). Indexed on `feedback_id` and on `(theme_type, theme)`.

### `profiles`
`id` (FK → `auth.users`), `full_name`, `role` (`student` | `admin`). New signups
default to `student`; the previous schema defaulted them to `admin`.

## 4. Why analysis moved out of the database

The sentiment and theme PL/pgSQL triggers were dropped (see
`supabase_migration_02_analysis_ownership.sql`). There were three
implementations of the same rules — JavaScript, PL/pgSQL, and a
no-Supabase fallback — and the browser could win the race and write a different
label than the trigger would have. Two of them could disagree indefinitely and
nothing detected it.

Now the Python API is the only writer of `sentiment_*`, and it is also the only
thing that writes `feedback_themes`. Leaving the `AFTER INSERT` theme trigger in
place would double-insert every theme row.

## 5. Authorisation, defensively in two places

| Layer | Mechanism | Catches |
|---|---|---|
| API | Supabase JWT verification + `profiles.role = 'admin'` | ordinary user with a valid session |
| Postgres | RLS: `SELECT ... TO authenticated USING (profiles.role = 'admin')` | anything reaching the DB without the service key |

The API reads with the service-role key (`db.admin_client()`), which bypasses
RLS — correct, because it has already authorised the request. That makes the RLS
policies the backstop rather than the primary gate, so `SUPABASE_SERVICE_ROLE_KEY`
must be set in any real deployment. When it is absent the code falls back to the
anon key and logs a warning at startup and on every admin read.

Writes also use the service-role key. There is no public `INSERT` policy on
`feedback`: the anon key is public and sits in this repository's git history, so
such a policy would let anyone write rows that never passed Pydantic and never
had `student_name` stripped. The API is the only writer, and it drops
`student_name` itself before inserting.

## 6. Failure modes

| Failure | Surface | User sees |
|---|---|---|
| Backend not running | `ApiError`, status `0` | "Cannot reach the analytics API at /api. Is the backend running?" |
| Missing env vars | `GET /api/health` → `misconfigured` | Badge: "Not Configured" + the setup steps |
| Supabase unreachable | `GET /api/health` → `degraded` | Badge: "DB Offline" |
| Token expired | `401` from any read | Token dropped, `isAdmin` false, `AccessDenied` shown |
| Valid token, not an admin | `403` | "This account is not registered as an administrator." |
| Insert rejected | `502` | "Nothing was saved — please try again."; form preserved |
| `feedback_themes` unreadable | envelope `degraded: true` + `notice` | Amber banner; corpus still shown |
| Over the rate limit | `429` + `Retry-After` | "Too many submissions from this network." |

## 7. Scaling

Current limits, and what each costs to lift:

- **2,000 rows per read.** Aggregation is in the browser over rows already
  fetched for the table. Past that, add a server-side aggregate endpoint — but
  port `summarize()` to Python rather than writing a second set of rules.
- **Per-process rate limiter.** N uvicorn workers give N× the configured limit.
  Replace `RateLimiter` with a Redis or Postgres-backed counter before scaling
  out.
- **Theme join is in-memory.** Fine for a campus corpus. At ~100k themes, push
  the grouping into a SQL view.
- **No caching.** `/api/feedback` re-queries on every poll. At higher traffic, add
  ETag/`If-None-Match` keyed on `max(created_at)`.

## 8. Running it

```bash
# 1. Database — once, for a new project
#    Supabase SQL Editor:  supabase_schema.sql
#    Existing project:     supabase_migration_02_analysis_ownership.sql

# 2. Backend
cd backend
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env                                # fill in SUPABASE_URL, SUPABASE_ANON_KEY
uvicorn app.main:app --reload --port 8000

# 3. Frontend — separate terminal
npm install
npm run dev            # http://localhost:5173, proxies /api -> :8000

# 4. Optional demo corpus (posts through the API so analysis runs)
python backend/scripts/seed_demo.py

# 5. Tests — no database or network required
pip install -r requirements-dev.txt
pytest backend/tests -q
```

Interactive API reference: `http://127.0.0.1:8000/api/docs`.
