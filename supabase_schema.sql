-- =========================================================
-- STUDENT FEEDBACK ANALYZER - SUPABASE DATABASE SCHEMA & SETUP
-- Execute this script in your Supabase SQL Editor
--
-- Re-runnable: every object is created with IF NOT EXISTS / OR REPLACE and
-- policies are dropped before they are created.
-- =========================================================


-- 1. PROFILES TABLE (Stores user roles: student / admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);

-- Function to handle new user registration profile creation.
--
-- SECURITY: the role is ALWAYS 'student'. This previously read
-- coalesce(new.raw_user_meta_data->>'role', 'admin'), which meant any account
-- could self-declare itself an administrator by passing `role: 'admin'` to
-- signUp() -- user metadata is attacker-controlled. Since every RLS policy in
-- this file trusts profiles.role, that was a full read/delete bypass of the
-- feedback corpus. Admin promotion is now an explicit server-side step:
--
--   update public.profiles set role = 'admin' where id = '<user uuid>';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to automatically create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. FEEDBACK TABLE
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  student_name text,
  department text,
  course_name text not null,
  faculty_name text,
  category text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) > 0),
  is_anonymous boolean default true,
  sentiment_label text default 'neutral' check (sentiment_label in ('positive', 'negative', 'neutral')),
  sentiment_score integer default 0,
  created_at timestamptz default now()
);

-- Supports the newest-first ordering used by both admin surfaces.
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);


-- 3. FEEDBACK THEMES TABLE (Stores recurring praises & issues)
create table if not exists public.feedback_themes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references public.feedback(id) on delete cascade,
  theme text not null,
  theme_type text not null check (theme_type in ('praise', 'issue')),
  created_at timestamptz default now()
);

-- The theme trigger writes one row per matched theme; this keeps the
-- after-insert fan-out cheap and the per-feedback lookups index-only.
create index if not exists feedback_themes_feedback_id_idx on public.feedback_themes (feedback_id);


-- 4. AUTOMATIC SENTIMENT ANALYSIS TRIGGER FUNCTION
--
-- Mirrored by src/lib/sentiment.js (analyzeSentiment). The word lists are kept
-- in sync deliberately: JS produces the preview, this trigger produces the
-- stored value, and a divergence would show as a contradictory dashboard.
create or replace function public.analyze_feedback_sentiment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  positive_count integer := 0;
  negative_count integer := 0;
  word text;
  cleaned_comment text;
  positive_words text[] := array[
    'good', 'great', 'excellent', 'helpful', 'clear',
    'amazing', 'friendly', 'interesting', 'supportive',
    'useful', 'best', 'explains', 'explained', 'understandable',
    'awesome', 'loved', 'superb', 'prompt', 'interactive',
    'engaging', 'structured', 'organized', 'patient', 'brilliant'
  ];
  negative_words text[] := array[
    'bad', 'poor', 'boring', 'difficult', 'late',
    'unclear', 'rude', 'slow', 'unfair', 'worst',
    'confusing', 'insufficient', 'noisy', 'outdated',
    'problem', 'delay', 'delayed', 'postponed', 'hard',
    'stuck', 'crash', 'crashes', 'crashed', 'freezes', 'nightmare'
  ];
begin
  -- Clean comment string
  cleaned_comment := lower(new.comment);

  foreach word in array regexp_split_to_array(cleaned_comment, '\s+')
  loop
    -- Clean punctuation from token
    word := regexp_replace(word, '[^a-z]', '', 'g');
    if word = '' then
      continue;
    end if;

    if word = any(positive_words) then
      positive_count := positive_count + 1;
    end if;

    if word = any(negative_words) then
      negative_count := negative_count + 1;
    end if;
  end loop;

  new.sentiment_score := positive_count - negative_count;

  if new.sentiment_score > 0 then
    new.sentiment_label := 'positive';
  elsif new.sentiment_score < 0 then
    new.sentiment_label := 'negative';
  else
    new.sentiment_label := 'neutral';
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_sentiment_trigger on public.feedback;
create trigger feedback_sentiment_trigger
  before insert on public.feedback
  for each row
  execute function public.analyze_feedback_sentiment();


-- 5. AUTOMATIC THEME EXTRACTION TRIGGER FUNCTION
--
-- Mirrored by src/lib/sentiment.js (extractThemes).
--
-- Every alternative below is \y-anchored (POSIX word boundary). The previous
-- version used bare substrings in a regex alternation, so:
--   * `ac`      matched "fACulty", "practical", "eACH", "headAChe"
--   * `lag`     matched "village", "flag"
--   * `wifi`    did NOT match the common "Wi-Fi" spelling
--   * `clear`   matched inside "unclear", tagging praise as an issue
--   * `fast`    matched inside "breakfast"
-- Together those false positives tagged essentially every submission with
-- facilities issues, which made the friction metrics meaningless.
create or replace function public.extract_feedback_themes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  comment_lower text := lower(new.comment);
begin
  -- Issue Theme Mappings
  if comment_lower ~* '\y(late|delay|delays|delayed|delaying|postpone|postpones|postponed|postponing|reschedule|rescheduled|rescheduling|cancel|cancels|cancelled|canceled|cancellation|overtime|short notice)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Delayed classes', 'issue');
  end if;

  -- `wi-?fi` is required so the common hyphenated spelling is matched.
  if comment_lower ~* '\y(wi-?fi|internet|network|networking|connectivity|connection|connections|router|modem|broadband|ethernet|hotspot|bandwidth)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Wi-Fi problems', 'issue');
  end if;

  if comment_lower ~* '\y(slow|slower|computer|computers|system|systems|pc|pcs|laptop|laptops|outdated|hardware|software|crash|crashes|crashed|crashing|freeze|freezes|freezing|froze|lag|lags|lagging|lagged|frozen|bootloop|bootloops)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Slow lab systems', 'issue');
  end if;

  -- Deliberately excludes the neutral verbs "explain"/"understand": including
  -- them made "Clear explanations" register as an issue as well as praise.
  if comment_lower ~* '\y(unclear|unclearly|confusing|confused|confusion|difficult|difficulty|vague|ambiguous|ambiguity|too fast|fast pace|rushed|incomprehensible|weak|hard to follow|hard to understand)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Unclear explanations', 'issue');
  end if;

  -- `a/c` is matched instead of the bare token `ac`; see the header note.
  if comment_lower ~* '\y(noisy|noise|loud|loudly|air conditioning|a/c|disturbance|disruption|projector|broken|cracked|uncomfortable|dirty|leaking|unusable|broken down)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Noisy / Bad Facilities', 'issue');
  end if;

  -- Praise Theme Mappings
  if comment_lower ~* '\y(helpful|supportive|kind|approachable|friendly|available|responsive|encouraging|encouraged|willing to help|goes out of the way|goes out of their way)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Helpful faculty', 'praise');
  end if;

  -- \y before "clear" cannot fire inside "unclear" (both sides are word
  -- characters), so praise is no longer double-counted as an issue.
  if comment_lower ~* '\y(clear|clearly|understandable|well explained|well structured|good teaching|patient|organised|organized|articulate)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Clear teaching', 'praise');
  end if;

  if comment_lower ~* '\y(interactive|interesting|engaging|enjoyed|fun|participate|participated|participation|participating|hands-on|discussion|group work|debate)\y' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Interactive classes', 'praise');
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_theme_trigger on public.feedback;
create trigger feedback_theme_trigger
  after insert on public.feedback
  for each row
  execute function public.extract_feedback_themes();


-- 6. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.feedback enable row level security;
alter table public.feedback_themes enable row level security;
alter table public.profiles enable row level security;

-- Student feedback insert policy: Anyone (anon or auth) can submit feedback
drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
on public.feedback
for insert
to anon, authenticated
with check (true);

-- Admin read policy: Only users with role = 'admin' in profiles can view feedback
drop policy if exists "Admins can view feedback" on public.feedback;
create policy "Admins can view feedback"
on public.feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Admin feedback delete/update policy
drop policy if exists "Admins can delete feedback" on public.feedback;
create policy "Admins can delete feedback"
on public.feedback
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Themes policies
drop policy if exists "Admins can view feedback themes" on public.feedback_themes;
create policy "Admins can view feedback themes"
on public.feedback_themes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

-- Profiles policies
--
-- A user may read their own row; admins may read all. Note this does not grant
-- UPDATE, so a signed-in student cannot promote themselves to 'admin'.
drop policy if exists "Users can view their own profile or admins can view all" on public.profiles;
create policy "Users can view their own profile or admins can view all"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id or role = 'admin'
);


-- 7. SAMPLE DEMO SEED DATA
-- Sentiment and theme columns are intentionally omitted: both triggers derive
-- them on insert, so seeding them here would only risk disagreeing with the
-- engine.
insert into public.feedback (student_name, department, course_name, faculty_name, category, rating, comment, is_anonymous)
values
  ('Alex Rivers', 'Computer Science', 'Data Structures & Algorithms', 'Dr. Aris Thorne', 'Teaching Quality', 5, 'The faculty explains tricky algorithm concepts clearly and is extremely helpful with labs!', false),
  ('Elena Vance', 'Computer Science', 'Database Management Systems', 'Prof. Sarah Jenkins', 'Lab Facilities', 2, 'The lab computers are very slow and outdated, causing frequent crashes during SQL practice.', false),
  ('Marcus Vance', 'Information Technology', 'Web Development', 'Dr. Aris Thorne', 'Course Content', 5, 'Interactive classes and great practical coding sessions. Loved the project assignments.', false),
  (null, 'Electronics & Comm', 'Digital Signal Processing', 'Prof. Robert Vance', 'Teaching Quality', 1, 'Unclear explanations and very fast pace. Hard to follow mathematical proofs.', true),
  (null, 'Computer Science', 'Computer Networks', 'Prof. Michael Scott', 'Classroom Facilities', 2, 'Severe Wi-Fi problems in the block and noisy classroom air conditioning.', true),
  ('Sophia Lin', 'Information Technology', 'Cloud Computing', 'Dr. Maya Lin', 'Faculty Interaction', 4, 'Very supportive and approachable faculty during office hours.', false),
  (null, 'Electrical Eng', 'Circuit Analysis', 'Dr. David Miller', 'Assessment / Exams', 3, 'Exams were difficult and delayed results release.', true),
  ('Lucas Bell', 'Computer Science', 'Artificial Intelligence', 'Dr. Aris Thorne', 'Teaching Quality', 5, 'Best professor ever! Clear explanations and supportive throughout project submissions.', false),
  (null, 'Computer Science', 'Operating Systems', 'Prof. Sarah Jenkins', 'Lab Facilities', 2, 'Computer systems lag constantly. Need upgraded RAM in Lab 3.', true);