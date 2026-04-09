import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { getAuthToken } from '../api/authApi';

/** Campus user (Module C – report & view own tickets). Matches Spring Security demo user. */
const USERNAME = 'user';
const PASSWORD = 'password';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const authHeader = useCallback(() => {
    const token = getAuthToken();
    if (token) {
      return `Bearer ${token}`;
    }
    return `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  }, []);

  const value = useMemo(() => ({ authHeader }), [authHeader]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
