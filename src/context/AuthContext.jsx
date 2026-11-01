'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '@/lib/api';

const AuthContext = createContext(null);
const NONE = {};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(NONE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setLoading(false); return; }
    try {
      const d = await api('/auth/me');
      setUser(d.user);
      setPermissions(d.permissions);
    } catch {
      tokenStore.clear();
      setUser(null);
      setPermissions(NONE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(d.token);
    setUser(d.user);
    setPermissions(d.permissions);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setPermissions(NONE);
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({ user, can: permissions, loading, login, logout, refresh }), [user, permissions, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
