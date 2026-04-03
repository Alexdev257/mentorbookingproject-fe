import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { UserInfo, AuthState } from '../types';
import { authApi } from '../api/services';

interface AuthContextType extends AuthState {
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

function decodeToken(token: string): UserInfo | null {
  try {
    const decoded = jwtDecode<Record<string, unknown>>(token);
    const roleRaw = decoded[ROLE_CLAIM] ?? decoded.role;
    const idRaw = decoded[NAME_ID_CLAIM] ?? decoded.sub ?? decoded.UserId;
    const emailRaw = decoded.email ?? decoded.Email;
    const fullNameRaw = decoded.Fullname ?? decoded.fullName ?? 'User';

    const role =
      typeof roleRaw === 'number' ? roleRaw : parseInt(String(roleRaw ?? '0'), 10);

    if (idRaw === undefined || idRaw === null) return null;

    return {
      id: String(idRaw),
      email: String(emailRaw ?? ''),
      fullName: String(fullNameRaw),
      role: Number.isNaN(role) ? 0 : role,
      avatarUrl: typeof decoded.avatarUrl === 'string' ? decoded.avatarUrl : undefined,
    };
  } catch {
    return null;
  }
}

function readAuthFromStorage(): AuthState {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken && refreshToken) {
    const user = decodeToken(accessToken);
    if (user) {
      return {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      };
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(readAuthFromStorage);
  /** Session is restored synchronously from storage; no async bootstrap. */
  const isLoading = false;

  const login = (accessToken: string, refreshToken: string) => {
    const user = decodeToken(accessToken);
    if (user) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setState({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
    }
  };

  const logout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        await authApi.logout();
      } catch {
        // Still clear local session if server unreachable
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook lives here so consumers keep importing from this module; fast-refresh wants components-only files for the default export pattern.
// eslint-disable-next-line react-refresh/only-export-components -- useAuth is the documented companion to AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
