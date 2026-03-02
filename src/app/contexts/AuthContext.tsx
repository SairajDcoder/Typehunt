import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('typehunt-token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile if token exists
  useEffect(() => {
    if (token) {
      api.getProfile()
        .then((res) => {
          setUser(res.data);
          socketService.connect(token);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('typehunt-token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      const { user: userData, token: newToken } = res.data;
      localStorage.setItem('typehunt-token', newToken);
      setToken(newToken);
      setUser(userData);
      socketService.connect(newToken);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    setError(null);
    try {
      const res = await api.register(email, username, password);
      const { user: userData, token: newToken } = res.data;
      localStorage.setItem('typehunt-token', newToken);
      setToken(newToken);
      setUser(userData);
      socketService.connect(newToken);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('typehunt-token');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
