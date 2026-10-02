-- =====================================================================
-- STUDENT FEEDBACK ANALYZER - SUPABASE SCHEMA
--
-- Run this in the Supabase SQL Editor for a fresh project.
-- For an existing project, run supabase_migration_02_analysis_ownership.sql
-- instead - it is idempotent and leaves your data alone.
--
-- The API is the only writer. See backend/app/routers/feedback.py.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES  (user roles: student / admin)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);

-- New signups default to the LEAST privilege. The previous version seeded
-- `coalesce(..., 'admin')`, which made every new signup an administrator.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. FEEDBACK
--
-- sentiment_label / sentiment_score are written by the Python API, not by a
-- trigger and not by the browser, so a record has exactly one verdict.
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  student_name text,
  course_code text,
  department text,
  course_name text not null,
  faculty_name text,
  category text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_anonymous boolean default true,
  sentiment_label text not null default 'neutral'
    check (sentiment_label in ('positive', 'negative', 'neutral')),
  sentiment_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_sentiment_idx  on public.feedback (sentiment_label);
create index if not exists feedback_course_idx     on public.feedback (course_name);

-- ---------------------------------------------------------------------
-- 3. FEEDBACK THEMES  (recurring praises & issues)
-- ---------------------------------------------------------------------
create table if not exists public.feedback_themes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  theme text not null,
  theme_type text not null check (theme_type in ('praise', 'issue')),
  created_at timestamptz default now()
);

create index if not exists feedback_themes_feedback_idx on public.feedback_themes (feedback_id);
create index if not exists feedback_themes_type_idx     on public.feedback_themes (theme_type, theme);

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--
-- The API authenticates with the service role and enforces authorisation in
-- application code (see backend/app/security.py). These policies are the
-- backstop for anything that reaches Postgres without going through it.
-- ---------------------------------------------------------------------
alter table public.feedback        enable row level security;
alter table public.feedback_themes enable row level security;
alter table public.profiles        enable row level security;

-- There is deliberately NO public INSERT policy. The submit form is served by
-- FastAPI, which validates the payload in Pydantic, strips `student_name`, and
-- writes with the service-role key. A `for insert to public` policy would only
-- let anyone holding the (public, and committed in git history) anon key bypass
-- all of that.

-- Reads are NOT public. The corpus holds verbatim student comments.
drop policy if exists "Anyone can view feedback" on public.feedback;
drop policy if exists "Admins can view feedback" on public.feedback;
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

drop policy if exists "Admins can modify feedback" on public.feedback;
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

drop policy if exists "Admins can delete feedback" on public.feedback;
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

drop policy if exists "Anyone can view feedback themes" on public.feedback_themes;
drop policy if exists "Admins can view feedback themes" on public.feedback_themes;
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

-- Theme rows are written by the API with the service role. No public insert.
drop policy if exists "Allow insert into feedback themes" on public.feedback_themes;

drop policy if exists "Users can view their own profile or admins can view all" on public.profiles;
create policy "Users can view their own profile or admins can view all"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or role = 'admin');

-- ---------------------------------------------------------------------
-- 5. SEEDING
--
-- There is intentionally no seed INSERT here. Seeding by SQL would bypass
-- the API's analyser and leave every row labelled 'neutral', so the
-- sentiment chart would look broken against real data.
--
-- Use:  python backend/scripts/seed_demo.py
-- ---------------------------------------------------------------------
