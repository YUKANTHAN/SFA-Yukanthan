-- =========================================================
-- STUDENT FEEDBACK ANALYZER - SUPABASE DATABASE SCHEMA & SETUP
-- Execute this script in your Supabase SQL Editor
-- =========================================================

-- 1. PROFILES TABLE (Stores user roles: student / admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);

-- Function to handle new user registration profile creation
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'admin'));
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
  comment text not null,
  is_anonymous boolean default true,
  sentiment_label text default 'neutral' check (sentiment_label in ('positive', 'negative', 'neutral')),
  sentiment_score integer default 0,
  created_at timestamptz default now()
);


-- 3. FEEDBACK THEMES TABLE (Stores recurring praises & issues)
create table if not exists public.feedback_themes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references public.feedback(id) on delete cascade,
  theme text not null,
  theme_type text not null check (theme_type in ('praise', 'issue')),
  created_at timestamptz default now()
);


-- 4. AUTOMATIC SENTIMENT ANALYSIS TRIGGER FUNCTION
create or replace function public.analyze_feedback_sentiment()
returns trigger
language plpgsql
as $$
declare
  positive_count integer := 0;
  negative_count integer := 0;
  word text;
  cleaned_comment text;
  positive_words text[] := array[
    'good', 'great', 'excellent', 'helpful', 'clear',
    'amazing', 'friendly', 'interesting', 'supportive',
    'useful', 'best', 'well explained', 'understandable',
    'awesome', 'loved', 'superb', 'prompt', 'interactive'
  ];
  negative_words text[] := array[
    'bad', 'poor', 'boring', 'difficult', 'late',
    'unclear', 'rude', 'slow', 'unfair', 'worst',
    'confusing', 'insufficient', 'noisy', 'outdated',
    'problem', 'delay', 'postponed', 'hard', 'stuck'
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
create or replace function public.extract_feedback_themes()
returns trigger
language plpgsql
security definer
as $$
declare
  comment_lower text := lower(new.comment);
begin
  -- Issue Theme Mappings
  if comment_lower ~* '(late|delay|postponed|overtime)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Delayed classes', 'issue');
  end if;

  if comment_lower ~* '(wifi|internet|network|connection|router)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Wi-Fi problems', 'issue');
  end if;

  if comment_lower ~* '(slow|computer|system|pc|outdated|hardware|lag)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Slow lab systems', 'issue');
  end if;

  if comment_lower ~* '(unclear|confusing|fast|difficult|understand|explain)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Unclear explanations', 'issue');
  end if;

  if comment_lower ~* '(noisy|noise|loud|disturbance|ac|projector)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Noisy / Bad Facilities', 'issue');
  end if;

  -- Praise Theme Mappings
  if comment_lower ~* '(helpful|supportive|kind|approachable|friendly)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Helpful faculty', 'praise');
  end if;

  if comment_lower ~* '(clear|understandable|well explained|good teaching)' then
    insert into public.feedback_themes(feedback_id, theme, theme_type)
    values (new.id, 'Clear teaching', 'praise');
  end if;

  if comment_lower ~* '(interactive|interesting|engaging|amazing|enjoyed)' then
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

-- Student feedback insert policy: Anyone can submit feedback
drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
on public.feedback
for insert
to public
with check (true);

-- Read policy: Anyone can view feedback in dashboard
drop policy if exists "Admins can view feedback" on public.feedback;
drop policy if exists "Anyone can view feedback" on public.feedback;
create policy "Anyone can view feedback"
on public.feedback
for select
to public
using (true);

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
drop policy if exists "Anyone can view feedback themes" on public.feedback_themes;
create policy "Anyone can view feedback themes"
on public.feedback_themes
for select
to public
using (true);

drop policy if exists "Allow insert into feedback themes" on public.feedback_themes;
create policy "Allow insert into feedback themes"
on public.feedback_themes
for insert
to public
with check (true);

-- Profiles policies
drop policy if exists "Users can view their own profile or admins can view all" on public.profiles;
create policy "Users can view their own profile or admins can view all"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id or role = 'admin'
);


-- 7. SAMPLE DEMO SEED DATA
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
