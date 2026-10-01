import { createClient } from '@supabase/supabase-js';
import { analyzeSentiment, extractThemes } from './sentiment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project-ref') &&
    supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEMO_STORE_KEY = 'student_feedback_demo_store';
export const DEMO_SESSION_KEY = 'demo_admin_session';
export const DEMO_ADMIN_EMAIL = 'admin@college.edu';
export const DEMO_ADMIN_PASSWORD = 'admin123';

/** Seed corpus for demo/preview mode. Mirrors the INSERTs in supabase_schema.sql. */
const INITIAL_DEMO_FEEDBACK = [
  {
    id: 'demo-1',
    student_name: 'Alex Rivers',
    department: 'Computer Science & Engineering',
    course_name: 'CS-301: Advanced Data Structures & Algorithms',
    faculty_name: 'Dr. Alan Turing',
    category: 'Teaching Quality',
    rating: 5,
    comment:
      'The lectures explain tricky algorithm concepts clearly and the visual trace diagrams were exceptionally helpful.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 3,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    student_name: 'Elena Vance',
    department: 'Computer Science & Engineering',
    course_name: 'ME-410: Finite Element Analysis & Dynamics',
    faculty_name: 'Prof. Nikola Tesla',
    category: 'Lab Facilities',
    rating: 2,
    comment:
      'The lab computers are very slow and outdated, causing frequent crashes during the simulation workload.',
    is_anonymous: false,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo-3',
    student_name: 'Marcus Vance',
    department: 'Humanities & Social Sciences',
    course_name: 'ENG-204: Technical Writing & Research Ethics',
    faculty_name: 'Prof. Elena Rostova',
    category: 'Course Content',
    rating: 5,
    comment:
      'Interactive classes and great practical writing sessions. Loved the peer review assignments and the discussion format.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 3,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'demo-4',
    student_name: null,
    department: 'Mathematics & Physics',
    course_name: 'PHYS-102: Electromagnetism & Statistical Mechanics',
    faculty_name: 'Dr. Richard Feynman',
    category: 'Teaching Quality',
    rating: 1,
    comment:
      'Unclear explanations and a very fast pace. Hard to follow the proofs and the syllabus moved too quickly.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'demo-5',
    student_name: null,
    department: 'Computer Science & Engineering',
    course_name: 'CS-301: Advanced Data Structures & Algorithms',
    faculty_name: 'Dr. Alan Turing',
    category: 'Classroom Facilities',
    rating: 2,
    comment:
      'Severe Wi-Fi problems in the lecture block and a noisy classroom air conditioning unit that could not be turned down.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 'demo-6',
    student_name: 'Sophia Lin',
    department: 'Computer Science & Engineering',
    course_name: 'CS-301: Advanced Data Structures & Algorithms',
    faculty_name: 'Dr. Alan Turing',
    category: 'Faculty Interaction',
    rating: 4,
    comment:
      'Very supportive and approachable faculty during office hours. Genuinely helpful with the project submissions.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 3,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'demo-7',
    student_name: null,
    department: 'Mathematics & Physics',
    course_name: 'MATH-202: Multivariable Calculus',
    faculty_name: 'Prof. Katherine Lin',
    category: 'Assessment & Exams',
    rating: 3,
    comment:
      'Exams were difficult and the results release was delayed by over three weeks, which made the capstone difficult to plan.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
  {
    id: 'demo-8',
    student_name: 'Lucas Bell',
    department: 'Computer Science & Engineering',
    course_name: 'CS-301: Advanced Data Structures & Algorithms',
    faculty_name: 'Dr. Alan Turing',
    category: 'Teaching Quality',
    rating: 5,
    comment:
      'Best professor ever! Clear explanations, well structured slides, and supportive throughout the project submissions.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 4,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

function readLocalStore() {
  try {
    const stored = localStorage.getItem(DEMO_STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('Local demo store was unreadable, reseeding', error);
  }
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(INITIAL_DEMO_FEEDBACK));
  // Return a copy: callers mutate what they get back, and handing out the shared
  // module-level constant would permanently corrupt it for the session.
  return [...INITIAL_DEMO_FEEDBACK];
}

function writeLocalStore(items) {
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(items));
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function submitFeedbackData(feedbackPayload) {
  const { sentiment_label, sentiment_score } = analyzeSentiment(feedbackPayload.comment);

  const fullPayload = {
    ...feedbackPayload,
    sentiment_label,
    sentiment_score,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('feedback').insert([fullPayload]).select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }
    return data[0];
  }

  const items = readLocalStore();
  const newItem = {
    ...fullPayload,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  items.unshift(newItem);
  writeLocalStore(items);
  return newItem;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/*                                                                            */
/* Every reader returns `{ items, degraded, notice }`. `degraded` tells the UI  */
/* that what it is about to render is not authoritative, so the shell can      */
/* surface a banner instead of silently showing plausible-looking demo data.   */
/* -------------------------------------------------------------------------- */

export function getLocalFeedback() {
  return readLocalStore();
}

export async function fetchFeedbackList() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      items: readLocalStore(),
      degraded: true,
      notice: 'Supabase is not configured — showing the built-in demo corpus.',
    };
  }

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase feedback fetch failed', error);
    return {
      items: [],
      degraded: true,
      notice: `Could not load the feedback corpus (${error.message}). Reconnect or check your admin session.`,
    };
  }

  return { items: data ?? [], degraded: false, notice: null };
}

export async function fetchFeedbackThemes() {
  // Themes live in a table populated by a Postgres trigger. In demo mode they
  // are derived from whatever feedback we actually hold, so the two stay in sync.
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('feedback_themes').select('*');

    if (error) {
      console.error('Supabase theme fetch failed', error);
      return {
        items: [],
        degraded: true,
        notice: `Could not load extracted themes (${error.message}).`,
      };
    }

    // An empty result is a legitimate state (no feedback yet) — never backfill
    // it with demo rows, which would mislabel the dashboard.
    return { items: data ?? [], degraded: false, notice: null };
  }

  const feedbackList = readLocalStore();
  const derived = [];

  feedbackList.forEach((item) => {
    extractThemes(item.comment).forEach((t) => {
      derived.push({
        id: `theme-${item.id}-${t.theme}`,
        feedback_id: item.id,
        theme: t.theme,
        theme_type: t.theme_type,
        created_at: item.created_at,
      });
    });
  });

  return {
    items: derived,
    degraded: true,
    notice: 'Themes derived client-side from the demo corpus.',
  };
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Resolves to a uniform `{ user }` shape in both live and demo mode.
 * Previously this returned a Promise in one branch and a plain object in the
 * other, which forced every caller into an awkward double-check.
 */
export async function getCurrentAdminSession() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session lookup failed', error);
      return { user: null };
    }
    return { user: data?.session?.user ?? null };
  }

  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return { user: null };
    const parsed = JSON.parse(raw);
    return { user: parsed?.user ?? null };
  } catch (error) {
    console.warn('Demo session was unreadable', error);
    return { user: null };
  }
}

export async function loginAdmin(email, password) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      throw new Error('Could not verify your administrator role.');
    }

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access denied: this account is not registered as an administrator.');
    }

    return data.user;
  }

  if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
    const user = {
      email: DEMO_ADMIN_EMAIL,
      role: 'admin',
      user_metadata: { full_name: 'Admin Faculty' },
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ user }));
    return user;
  }

  throw new Error(
    `Invalid demo credentials. Use ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}, or configure Supabase.`
  );
}

export async function logoutAdmin() {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out failed', error);
    return;
  }
  localStorage.removeItem(DEMO_SESSION_KEY);
}