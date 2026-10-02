/**
 * The only module in the app that talks to the network.
 *
 * Rules this file exists to enforce:
 *   1. No database credentials and no SDK live in the browser bundle.
 *   2. No fallback dataset. If the API cannot answer, the caller gets an
 *      error. A silently-substituted corpus is how submissions came to be
 *      "accepted" while the dashboard showed nothing.
 *   3. Collection reads return the envelope the backend declares
 *      (`{ items, total, degraded, notice }`). Readers must not destructure
 *      a bare array - that mismatch is the bug this rewrite fixed.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const TOKEN_KEY = 'edupulse_admin_token';
const CORPUS_VERSION_KEY = 'edupulse_corpus_version';

export class ApiError extends Error {
  constructor(message, { status, degraded = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.degraded = degraded;
  }
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private-mode browsers reject writes. The session simply will not persist.
  }
}

// ---------------------------------------------------------------------------
// Cross-tab corpus freshness
// ---------------------------------------------------------------------------

/**
 * Bumped on every successful submission. The dashboard compares the value it
 * last loaded against the current one and refetches on a mismatch, which is
 * what makes "I submitted feedback, now open Analytics" show the new row.
 */
export function getCorpusVersion() {
  try {
    return Number(localStorage.getItem(CORPUS_VERSION_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markCorpusChanged() {
  try {
    localStorage.setItem(CORPUS_VERSION_KEY, String(getCorpusVersion() + 1));
  } catch {
    // Non-fatal: the dashboard still polls on an interval.
  }
}

export function subscribeToCorpusChanges(handler) {
  const onStorage = (event) => {
    if (event.key === CORPUS_VERSION_KEY) handler();
  };

  window.addEventListener('storage', onStorage);
  document.addEventListener('visibilitychange', onFocusVisible);

  return () => {
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', onFocusVisible);
  };

  function onFocusVisible() {
    if (document.visibilityState === 'visible') handler();
  }
}

/** Fires when another tab signs in or out, so both tabs agree on the session. */
export function subscribeToSessionChanges(handler) {
  const onStorage = (event) => {
    if (event.key === TOKEN_KEY) handler();
  };

  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function request(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      `Cannot reach the analytics API at ${API_BASE}. Is the backend running?`,
      { status: 0 },
    );
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // A 401 on a read means the session lapsed; drop it so the guard
    // re-renders as signed-out instead of looping on a dead token.
    if (response.status === 401) setToken(null);
    throw new ApiError(detailOf(payload, response.status), { status: response.status });
  }

  return payload;
}

function detailOf(payload, status) {
  if (typeof payload?.detail === 'string') return payload.detail;
  if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
    return payload.detail.map((entry) => entry.msg).filter(Boolean).join(' ') || 'The submission was rejected.';
  }
  return `Request failed (${status}).`;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkHealth() {
  const data = await request('/health');
  return {
    ok: data?.status === 'ok',
    status: data?.status ?? 'unknown',
    database: data?.database ?? 'unknown',
    detail: data?.detail ?? null,
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export async function submitFeedback(payload) {
  const saved = await request('/feedback', { method: 'POST', body: payload });
  markCorpusChanged();
  return saved;
}

/**
 * A collection read must arrive as `{ items, total, degraded, notice }`.
 *
 * The original bug was a bare array meeting a reader that destructured
 * `.items`: `undefined` flowed into `summarize()`, the dashboard rendered
 * zeros, and no surface reported a cause. `FeedbackListOut` declares the shape
 * on the server, so a violation here is our bug - fail loudly at the boundary
 * instead of silently rendering an empty page.
 */
function requireEnvelope(payload, what) {
  if (!payload || !Array.isArray(payload.items)) {
    throw new ApiError(
      `The API returned an unexpected ${what} response - expected an { items } envelope.`,
      { status: 0 },
    );
  }
  return payload;
}

export async function fetchFeedbackList(signal) {
  return requireEnvelope(await request('/feedback', { auth: true, signal }), 'feedback list');
}

export async function fetchFeedbackThemes(signal) {
  return requireEnvelope(
    await request('/feedback/themes', { auth: true, signal }),
    'feedback themes',
  );
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAdmin(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.access_token);
  return data.user;
}

/**
 * Resolves the stored token to a real session.
 *
 * Returns null rather than throwing when there is no token, and propagates a
 * genuine 401/403 so a revoked account is signed out instead of being trusted
 * on the strength of a value sitting in localStorage.
 */
export async function getCurrentAdminSession() {
  if (!getToken()) return null;
  return request('/auth/me', { auth: true });
}

export async function logoutAdmin() {
  setToken(null);
  return null;
}
