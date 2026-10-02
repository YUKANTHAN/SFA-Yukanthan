import { useCallback, useEffect, useState } from 'react';
import { getCurrentAdminSession, logoutAdmin, subscribeToSessionChanges } from '../lib/api';

/**
 * Single source of truth for admin-session state.
 *
 * Fail-closed by construction: `isAdmin` starts false and only becomes true
 * once the API has confirmed the stored token resolves to a real administrator.
 * The browser's own copy of the token is never treated as proof.
 *
 * `error` is separate from `isAdmin` on purpose. "You are not signed in" and
 * "the API is unreachable" need different messages, and conflating them sends
 * an operator to a login form that cannot possibly succeed.
 */
export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resolved = await getCurrentAdminSession();
      setUser(resolved);
      setIsAdmin(Boolean(resolved));
      setError(null);
    } catch (err) {
      setUser(null);
      setIsAdmin(false);
      setError(err.message || 'Could not verify your session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Signing out in one tab must sign out the others, not just the one that
  // happened to have the button pressed.
  useEffect(() => subscribeToSessionChanges(refresh), [refresh]);

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error('Sign out failed', err);
    } finally {
      setUser(null);
      setIsAdmin(false);
      setError(null);
    }
  }, []);

  return { isAdmin, user, loading, error, refresh, signOut };
}
