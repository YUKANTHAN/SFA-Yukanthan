import { useCallback, useEffect, useState } from 'react';
import { getCurrentAdminSession, logoutAdmin } from '../lib/supabase';

/**
 * Single source of truth for admin-session state.
 *
 * This replaces three near-identical guards (Navbar / Dashboard / FeedbackDetails)
 * that had drifted apart — one of which initialised `authorized = true` and
 * therefore rendered the full dashboard whenever its effect threw.
 *
 * Fail-closed by construction: `isAdmin` starts false and only ever becomes
 * true once a session has actually been resolved.
 */
export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { user: resolvedUser } = await getCurrentAdminSession();
      setUser(resolvedUser);
      setIsAdmin(Boolean(resolvedUser));
    } catch (error) {
      console.error('Admin session check failed', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  return { isAdmin, user, loading, refresh, signOut };
}