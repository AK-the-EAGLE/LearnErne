import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient, { setCsrfToken } from '../lib/api';
import { applyPreferencesTheme, DEFAULT_PREFERENCES } from '../preferences/userPreferences';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const loadUserPreferences = useCallback(async () => {
    try {
      const response = await apiClient('/users/me/preferences');
      applyPreferencesTheme(response.data.preferences);
    } catch {
      applyPreferencesTheme(DEFAULT_PREFERENCES);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const response = await apiClient('/auth/me');
      const nextUser = response.data.user;
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'anonymous');
      if (nextUser) {
        await loadUserPreferences();
      }
      return nextUser;
    } catch (requestError) {
      setUser(null);
      setStatus('error');
      setError(requestError.message || 'The authentication service is unavailable.');
      return null;
    }
  }, [loadUserPreferences]);

  useEffect(() => {
    let active = true;
    apiClient('/auth/me')
      .then(async (response) => {
        if (!active) return;
        const nextUser = response.data.user;
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'anonymous');
        if (nextUser) await loadUserPreferences();
      })
      .catch((requestError) => {
        if (!active) return;
        setUser(null);
        setStatus('error');
        setError(requestError.message || 'The authentication service is unavailable.');
      });
    return () => { active = false; };
  }, [loadUserPreferences]);

  const signIn = useCallback(async (credentials) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setCsrfToken(response.data.csrfToken);
    setUser(response.data.user);
    setStatus('authenticated');
    setError('');
    await loadUserPreferences();
    return response.data.user;
  }, [loadUserPreferences]);

  const signUp = useCallback(async (details) => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    });
    setCsrfToken(response.data.csrfToken);
    setUser(response.data.user);
    setStatus('authenticated');
    setError('');
    await loadUserPreferences();
    return response.data.user;
  }, [loadUserPreferences]);

  const signOut = useCallback(async () => {
    await apiClient('/auth/logout', { method: 'POST' });
    setCsrfToken(null);
    applyPreferencesTheme(DEFAULT_PREFERENCES);
  }, []);

  const updateUser = useCallback((nextUser) => setUser(nextUser), []);

  const value = useMemo(() => ({
    status,
    user,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateUser,
    refreshPreferences: loadUserPreferences,
  }), [status, user, error, signIn, signUp, signOut, refreshSession, updateUser, loadUserPreferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
