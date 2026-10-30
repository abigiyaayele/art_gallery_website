import type { Session } from '@platform/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, applySession, refreshSession, setSessionListener } from './api';

interface AuthState {
  session: Session | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  switchTenant(tenantId: string): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSessionListener(setSession);
    refreshSession().finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    applySession(await api<Session>('/auth/login', { method: 'POST', json: { email, password } }));
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    applySession(null);
    queryClient.clear();
  }, [queryClient]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      applySession(await api<Session>('/auth/switch-tenant', { method: 'POST', json: { tenantId } }));
      // Every cached query belongs to the previous workspace.
      queryClient.clear();
    },
    [queryClient],
  );

  const value = useMemo(() => ({ session, loading, login, logout, switchTenant }), [session, loading, login, logout, switchTenant]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The workspace the session is bound to. */
export function useWorkspace() {
  const { session } = useAuth();
  const workspace = session?.workspaces.find(w => w.tenantId === session.activeTenantId) ?? null;
  return { workspace, role: workspace?.role ?? null, isOwner: workspace?.role === 'owner' };
}
