/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setCsrfToken } from '../lib/api';
import { AuthProvider } from './AuthProvider';
import { getSafeReturnPath } from './returnPath';
import { useAuth } from './useAuth';

function apiResponse(data) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, data }),
  };
}

function AuthProbe() {
  const auth = useAuth();

  async function signIn() {
    await auth.signIn({ email: 'learner@example.com', password: 'example-password' });
  }

  async function signOut() {
    await auth.signOut();
    await auth.refreshSession();
  }

  return (
    <div>
      <p>Status: {auth.status}</p>
      <p>User: {auth.user?.displayName || 'none'}</p>
      <button type="button" onClick={signIn}>Sign in</button>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}

describe('AuthProvider integration', () => {
  let fetchMock;

  beforeEach(() => {
    setCsrfToken(null);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('restores an anonymous server session at startup', async () => {
    fetchMock.mockResolvedValueOnce(apiResponse({ user: null }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(await screen.findByText('Status: anonymous')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('signs in with CSRF protection and invalidates the session on sign-out', async () => {
    const user = { id: 'user-1', displayName: 'Learner' };
    fetchMock
      .mockResolvedValueOnce(apiResponse({ user: null }))
      .mockResolvedValueOnce(apiResponse({ csrfToken: 'csrf-initial' }))
      .mockResolvedValueOnce(apiResponse({ user, csrfToken: 'csrf-rotated' }))
      .mockResolvedValueOnce(apiResponse({
        preferences: {
          darkMode: false,
          courseReminders: false,
          weeklyDigest: false,
          progressHighlights: false,
        },
      }))
      .mockResolvedValueOnce(apiResponse({}))
      .mockResolvedValueOnce(apiResponse({ user: null }));

    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await screen.findByText('Status: anonymous');

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Status: authenticated')).toBeTruthy();
    expect(screen.getByText('User: Learner')).toBeTruthy();

    const loginCall = fetchMock.mock.calls.find(([url]) => url === '/api/v1/auth/login');
    expect(loginCall[1].headers['X-CSRF-Token']).toBe('csrf-initial');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByText('Status: anonymous')).toBeTruthy());

    const logoutCall = fetchMock.mock.calls.find(([url]) => url === '/api/v1/auth/logout');
    expect(logoutCall[1].headers['X-CSRF-Token']).toBe('csrf-rotated');
    expect(screen.getByText('User: none')).toBeTruthy();
  });
});

describe('safe return paths', () => {
  it('accepts only same-origin canonical private destinations', () => {
    expect(getSafeReturnPath('/profile?tab=activity#recent')).toBe('/profile?tab=activity#recent');
    expect(getSafeReturnPath('//example.com')).toBe('/dashboard');
    expect(getSafeReturnPath('/auth')).toBe('/dashboard');
    expect(getSafeReturnPath('https://example.com/settings')).toBe('/dashboard');
  });
});
