import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, LoginRequest } from '@/types';
import {
  login as apiLogin,
  logout as apiLogout,
  getMe as apiGetMe,
  getToken as apiGetToken,
  removeToken as apiRemoveToken,
} from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const refreshUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const user = await apiGetMe();
      setState((prev) => ({
        ...prev,
        user,
        token: apiGetToken(),
        loading: false,
      }));
    } catch (error) {
      apiRemoveToken();
      setState({
        user: null,
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : '获取用户信息失败',
      });
    }
  }, []);

  useEffect(() => {
    const token = apiGetToken();
    if (token) {
      refreshUser();
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiLogin(credentials);
      setState({
        user: result.user,
        token: result.token,
        loading: false,
        error: null,
      });
      return result.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await apiLogout();
    } catch {
    } finally {
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
