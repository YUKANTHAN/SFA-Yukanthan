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

// Fallback dummy client if credentials aren't set
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial mock dataset for offline/preview demo mode
const INITIAL_DEMO_FEEDBACK = [
  {
    id: 'demo-1',
    student_name: 'Alex Rivers',
    department: 'Computer Science',
    course_name: 'Data Structures & Algorithms',
    faculty_name: 'Dr. Aris Thorne',
    category: 'Teaching Quality',
    rating: 5,
    comment: 'The faculty explains tricky algorithm concepts clearly and is extremely helpful with labs!',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 2,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'demo-2',
    student_name: 'Elena Vance',
    department: 'Computer Science',
    course_name: 'Database Management Systems',
    faculty_name: 'Prof. Sarah Jenkins',
    category: 'Lab Facilities',
    rating: 2,
    comment: 'The lab computers are very slow and outdated, causing frequent crashes during SQL practice.',
    is_anonymous: false,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'demo-3',
    student_name: 'Marcus Vance',
    department: 'Information Technology',
    course_name: 'Web Development',
    faculty_name: 'Dr. Aris Thorne',
    category: 'Course Content',
    rating: 5,
    comment: 'Interactive classes and great practical coding sessions. Loved the project assignments.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 3,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'demo-4',
    student_name: null,
    department: 'Electronics & Comm',
    course_name: 'Digital Signal Processing',
    faculty_name: 'Prof. Robert Vance',
    category: 'Teaching Quality',
    rating: 1,
    comment: 'Unclear explanations and very fast pace. Hard to follow mathematical proofs.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-5',
    student_name: null,
    department: 'Computer Science',
    course_name: 'Computer Networks',
    faculty_name: 'Prof. Michael Scott',
    category: 'Classroom Facilities',
    rating: 2,
    comment: 'Severe Wi-Fi problems in the block and noisy classroom air conditioning.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -2,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: 'demo-6',
    student_name: 'Sophia Lin',
    department: 'Information Technology',
    course_name: 'Cloud Computing',
    faculty_name: 'Dr. Maya Lin',
    category: 'Faculty Interaction',
    rating: 4,
    comment: 'Very supportive and approachable faculty during office hours.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 2,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'demo-7',
    student_name: null,
    department: 'Electrical Eng',
    course_name: 'Circuit Analysis',
    faculty_name: 'Dr. David Miller',
    category: 'Assessment / Exams',
    rating: 3,
    comment: 'Exams were difficult and delayed results release.',
    is_anonymous: true,
    sentiment_label: 'negative',
    sentiment_score: -1,
    created_at: new Date(Date.now() - 3600000 * 60).toISOString()
  },
  {
    id: 'demo-8',
    student_name: 'Lucas Bell',
    department: 'Computer Science',
    course_name: 'Artificial Intelligence',
    faculty_name: 'Dr. Aris Thorne',
    category: 'Teaching Quality',
    rating: 5,
    comment: 'Best professor ever! Clear explanations and supportive throughout project submissions.',
    is_anonymous: false,
    sentiment_label: 'positive',
    sentiment_score: 3,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

// Helper functions for data fetch & insertion with automatic fallback
export async function submitFeedbackData(feedbackPayload) {
  const { sentiment_label, sentiment_score } = analyzeSentiment(feedbackPayload.comment);
  
  const fullPayload = {
    ...feedbackPayload,
    sentiment_label,
    sentiment_score
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('feedback')
      .insert([fullPayload])
      .select();
    
    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }
    return data[0];
  } else {
    // Fallback Mock Store in LocalStorage
    const localData = getLocalFeedback();
    const newItem = {
      ...fullPayload,
      id: 'local-' + Date.now(),
      created_at: new Date().toISOString()
    };
    localData.unshift(newItem);
    localStorage.setItem('student_feedback_demo_store', JSON.stringify(localData));
    return newItem;
  }
}

export function getLocalFeedback() {
  const stored = localStorage.getItem('student_feedback_demo_store');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local feedback', e);
    }
  }
  localStorage.setItem('student_feedback_demo_store', JSON.stringify(INITIAL_DEMO_FEEDBACK));
  return INITIAL_DEMO_FEEDBACK;
}

export async function fetchFeedbackList() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed, falling back to local data', error);
      return getLocalFeedback();
    }
    return data;
  } else {
    return getLocalFeedback();
  }
}

export async function fetchFeedbackThemes() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('feedback_themes')
      .select('*');

    if (!error && data && data.length > 0) {
      return data;
    }
  }

  // Derive themes from all feedback items for local/fallback mode
  const feedbackList = getLocalFeedback();
  const derivedThemes = [];
  
  feedbackList.forEach(item => {
    const extracted = extractThemes(item.comment);
    extracted.forEach(t => {
      derivedThemes.push({
        id: `theme-${item.id}-${t.theme}`,
        feedback_id: item.id,
        theme: t.theme,
        theme_type: t.theme_type,
        created_at: item.created_at
      });
    });
  });

  return derivedThemes;
}

// Admin auth helper
export async function loginAdmin(email, password) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    
    // Check admin role in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access denied: User is not registered as an administrator.');
    }

    return data;
  } else {
    // Demo mode admin login verification
    if (email === 'admin@college.edu' && password === 'admin123') {
      const mockSession = {
        user: { email: 'admin@college.edu', role: 'admin', user_metadata: { full_name: 'Admin Faculty' } }
      };
      localStorage.setItem('demo_admin_session', JSON.stringify(mockSession));
      return mockSession;
    } else {
      throw new Error('Invalid demo credentials! Use admin@college.edu / admin123 or configure Supabase.');
    }
  }
}

export function getCurrentAdminSession() {
  if (isSupabaseConfigured && supabase) {
    return supabase.auth.getSession();
  } else {
    const session = localStorage.getItem('demo_admin_session');
    return session ? JSON.parse(session) : null;
  }
}

export function logoutAdmin() {
  if (isSupabaseConfigured && supabase) {
    return supabase.auth.signOut();
  } else {
    localStorage.removeItem('demo_admin_session');
    return Promise.resolve();
  }
}
