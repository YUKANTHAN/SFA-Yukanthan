# Rules

Invariants for this repository. Breaking one reintroduces a bug that has
already been shipped once. If a change needs to violate a rule, that is a
signal to change the rule deliberately and record why in `docs/MEMORY.md`.

---

## Data flow

1. **Only `src/lib/api.js` may call `fetch`.** No component, page or hook makes a
   request directly. This keeps auth headers, error mapping and the envelope
   shape in one place.

2. **Only `backend/app/db.py` may import Supabase.** No router, script or test
   builds a client.

3. **Only `backend/app/analysis.py` may classify sentiment or extract themes.**
   There was a JS copy, a PL/pgSQL copy and a fallback copy. They disagreed.
   One implementation only.

4. **Only `src/lib/analytics.js` may aggregate.** No Python equivalent. A second
   implementation of `summarize()` is how the sentiment counts would start
   disagreeing between two screens.

5. **Collection reads return `{ items, total, degraded, notice }`.** Readers
   must not destructure a bare array. This mismatch is the original defect:
   `result.items` was `undefined`, `attachThemes` coerced it to `[]`, and the
   dashboard rendered zeros with no error.

6. **No fallback dataset, anywhere.** No seeded corpus, no cached copy, no
   `catch` that returns sample data. If the API cannot answer, the caller gets
   an error. A substituted dataset is how a completely broken read path
   masqueraded as an empty result set.

7. **Never swallow an error on a write.** A failed insert is a `5xx` and a
   visible message. The previous `console.warn` reported success for a
   submission that had not been saved.

---

## Security

8. **No credentials in the browser bundle.** No Supabase URL, anon key or
   service key in `src/`, and no `VITE_` variable that holds one. `VITE_` values
   are public by definition.

9. **`student_name` is always `NULL`.** The field is accepted on the wire and
   dropped. Anonymity is enforced on the write path and in the `INSERT` policy,
   not by the form omitting it.

10. **Reads of the corpus require an admin.** Supabase JWT **and**
    `profiles.role = 'admin'`, checked server-side. The browser's copy of a
    token is never treated as proof of anything.

11. **Never add a hardcoded credential or bypass.** There is no demo account and
    no backdoor. `admin@college.edu / admin123` shipped to every visitor.

12. **New signups default to the least privilege.** `student`, never `admin`.

13. **`SUPABASE_SERVICE_ROLE_KEY` is server-only**, gitignored, and absent from
    `backend/.env.example` as anything but an empty line.

---

## Anonymity and the database

14. **RLS is a backstop, not the gate.** The API authorises in application code
    and reads with the service key, which bypasses RLS. Keep both layers.

15. **Schema changes ship as two files.** `supabase_schema.sql` for a fresh
    project; a numbered, idempotent, data-preserving migration for an existing
    one. Never edit the schema in a way that only a new project would get.

16. **Do not seed data with SQL.** Bypassing the API bypasses the analyser, so
    every seeded row is labelled `neutral` and the sentiment chart disagrees with
    real submissions. Use `backend/scripts/seed_demo.py`.

---

## Frontend conventions

17. **`src/lib/design.js` owns the taxonomy.** Categories, departments, courses,
    rating labels and sentiment presentation metadata live there. Do not
    duplicate them into a page or a chart.

18. **Charts are pure.** Chart components take data and render. They do not
    fetch, transform or aggregate.

19. **One session hook.** `useAdminSession` is the only source of admin state.
    Guard logic must fail closed — `isAdmin` starts `false` and only becomes
    `true` after the API confirms a principal.

20. **Distinguish "signed out" from "API down".** They need different messages.
    Collapsing them sends an operator to a login form that cannot succeed.

21. **Match the design system.** Spacing scale, type ramp and radii come from
    `docs/DESIGN.md` via the Tailwind theme in `src/index.css`. No one-off hex
    values in components.

22. **Accessible by default.** Labelled controls, `role`/`aria-*` on
    non-semantic elements, keyboard-dismissable overlays, visible focus.

---

## Python

23. **`analysis.py` stays pure.** No I/O, no database, no globals mutated at
    runtime. That is what makes `backend/tests/test_analysis.py` run with no
    database and no network.

24. **Validate at the boundary.** Pydantic models in `schemas.py` mirror the form
    constraints; do not scatter `if` checks through route bodies.

25. **Declaring the response shape is part of the work.** A route returning an
    ad-hoc dict is how the envelope bug recurs.

26. **Use `Depends` for authorisation.** Never call the admin check inside a
    handler body; the framework then cannot apply it consistently.

27. **Broad `except Exception` is a boundary, not a default.** It is acceptable
    around a third-party call whose error text must not leak, and the route must
    then raise a deliberate status code. It is not acceptable as a catch-all.

28. **Tests must run offline.** `backend/tests` patches `app.db`. A test that
    needs a live Supabase project is a script, not a test.

---

## Before you commit

```bash
npm run lint                     # no errors
npm run build                    # must succeed
pytest backend/tests -q          # no database required
```

And confirm by hand:

- Submit feedback, then open Analytics. The new row is there without a refresh.
- Stop the backend. Every surface says so specifically, none shows sample data.
- `grep -riE "supabase\.co|GoTrueClient|SupabaseClient|eyJ[A-Za-z0-9_-]{10,}" dist/assets/` returns nothing. Checking for the bare word `supabase` does not: the health badge names `supabase_schema.sql` as a setup step, and that is fine. What must never ship is the URL, a key, or the SDK.
