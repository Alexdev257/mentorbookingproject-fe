import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { UserInfo, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const decodeToken = (token: string): UserInfo | null => {
    try {
      const decoded: any = jwtDecode(token);
      // Backend JWT usually has: 
      // http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier -> id
      // http://schemas.microsoft.com/ws/2008/06/identity/claims/role -> role
      // email -> email
      // Fullname -> fullName
      return {
        id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub || decoded.UserId,
        email: decoded.email || decoded.Email,
        fullName: decoded.Fullname || decoded.fullName || 'User',
        role: parseInt(decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role),
        avatarUrl: decoded.avatarUrl,
      };
    } catch {
      return null;
    }
  };

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

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken && refreshToken) {
      const user = decodeToken(accessToken);
      if (user) {
        setState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      } else {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
