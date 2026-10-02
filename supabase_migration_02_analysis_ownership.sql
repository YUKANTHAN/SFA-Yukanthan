-- =====================================================================
-- MIGRATION 02 - hand analysis ownership to the API
--
-- For projects created with the earlier supabase_schema.sql. Idempotent:
-- safe to run more than once. Preserves all existing rows.
--
-- What changes:
--   1. The BEFORE INSERT sentiment trigger is dropped. The Python API
--      computes sentiment_score/sentiment_label and writes them.
--   2. The AFTER INSERT theme trigger is dropped. The API writes
--      feedback_themes explicitly. Left in place, it would double-insert.
--   3. `course_code` is added to feedback.
--   4. Every existing RLS policy on feedback and feedback_themes is dropped
--      and the final admin-only SELECT set is recreated.
--   5. No public INSERT anywhere: the API is the only writer.
--
-- After running this, set SUPABASE_SERVICE_ROLE_KEY in backend/.env so the
-- API can read the corpus, and confirm REQUIRE_AUTH_ON_READS=true.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Backfill analysis for rows written before this change.
--    Rows inserted before the trigger existed - or while it was broken -
--    are stuck at the column defaults and would read as 100% neutral.
-- ---------------------------------------------------------------------
-- Everything up to the commit is the migration. Section 7 is read-only
-- diagnostics and deliberately sits outside it: a typo in a SELECT should
-- never be able to roll back a schema change.
begin;

update public.feedback
set sentiment_label = case
        when sentiment_score > 0 then 'positive'
        when sentiment_score < 0 then 'negative'
        else 'neutral'
      end
where sentiment_label is null;

-- Columns must be NOT NULL now that the API is the only writer.
alter table public.feedback
  alter column sentiment_label set default 'neutral',
  alter column sentiment_label set not null,
  alter column sentiment_score set default 0,
  alter column sentiment_score set not null;

-- ---------------------------------------------------------------------
-- 2. course_code
-- ---------------------------------------------------------------------
alter table public.feedback add column if not exists course_code text;

-- ---------------------------------------------------------------------
-- 3. Drop the analysis triggers
-- ---------------------------------------------------------------------
drop trigger if exists feedback_sentiment_trigger on public.feedback;
drop trigger if exists feedback_theme_trigger on public.feedback;

-- The functions themselves are left in place, unused, so that reverting this
-- migration is possible. They can be dropped with:
--   drop function if exists public.analyze_feedback_sentiment();
--   drop function if exists public.extract_feedback_themes();

-- ---------------------------------------------------------------------
-- 4. Close public reads of the corpus
-- ---------------------------------------------------------------------
alter table public.feedback        enable row level security;
alter table public.feedback_themes enable row level security;

-- Drop EVERY policy on the corpus tables, by name looked up rather than by
-- name assumed. Two reasons this is not a list of `drop policy if exists`:
--   1. Idempotency. `create policy` has no `if not exists`, so recreating a
--      policy that is already present fails with 42710 and rolls the whole
--      script back.
--   2. Correctness. This project was created from an older schema whose
--      permissive policy names are not knowable from here. Any leftover
--      `to anon` or `to public` SELECT policy would keep the verbatim student
--      comments readable using the public anon key, and the named drops below
--      would not have caught it.
do $$
declare
  pol record;
begin
  for pol in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('feedback', 'feedback_themes')
  loop
    execute format(
      'drop policy if exists %I on public.%I', pol.policyname, pol.tablename
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Create the final policy set: admin SELECT only.
--    Nothing public. The anon key is rejected outright, which also means
--    rows can never arrive without passing Pydantic and the `student_name`
--    strip in routers/feedback.py.
-- ---------------------------------------------------------------------
create policy "Admins can view feedback"
  on public.feedback
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can modify feedback"
  on public.feedback
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete feedback"
  on public.feedback
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can view feedback themes"
  on public.feedback_themes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------
-- 6. Indexes for the dashboard's newest-first reads
-- ---------------------------------------------------------------------
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_sentiment_idx  on public.feedback (sentiment_label);
create index if not exists feedback_course_idx     on public.feedback (course_name);
create index if not exists feedback_themes_feedback_idx on public.feedback_themes (feedback_id);
create index if not exists feedback_themes_type_idx     on public.feedback_themes (theme_type, theme);

commit;

-- ---------------------------------------------------------------------
-- 7. Verify
-- ---------------------------------------------------------------------
select sentiment_label, count(*) from public.feedback group by 1 order by 2 desc;

-- pg_trigger columns are tg*; conname belongs to pg_constraint.
select tgname as trigger_name, tgrelid::regclass as on_table
from pg_trigger
where tgrelid in ('public.feedback'::regclass, 'public.feedback_themes'::regclass)
  and not tgisinternal;
-- Expect: no rows for public.feedback or public.feedback_themes. Any row here
-- means a database-side analysis trigger survived and will double-write.

select tablename, policyname, cmd, roles::text
from pg_policies
where schemaname = 'public' and tablename in ('feedback', 'feedback_themes')
order by tablename, policyname;
-- Expect exactly four rows, all `cmd = SELECT` except the update/delete pair,
-- and every `roles` list must be {authenticated}. Anything mentioning anon or
-- public here means a permissive policy survived.
