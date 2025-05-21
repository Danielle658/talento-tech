"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useMemo } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Simulate initial loading

  // Simulate checking auth status on mount
  useState(() => {
    // In a real app, check localStorage or a cookie
    const storedAuth = typeof window !== "undefined" ? localStorage.getItem("moneywise-auth") : null;
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  });

  const login = useCallback(() => {
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("moneywise-auth", "true");
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("moneywise-auth");
    }
  }, []);

  const value = useMemo(() => ({ isAuthenticated, login, logout, isLoading }), [isAuthenticated, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
