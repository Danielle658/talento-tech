
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { AUTH_STATUS_KEY, CURRENT_COMPANY_KEY } from '@/lib/constants';

interface AuthContextType {
  isAuthenticated: boolean;
  currentCompany: string | null;
  login: (companyName: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = typeof window !== "undefined" ? localStorage.getItem(AUTH_STATUS_KEY) : null;
    const storedCompany = typeof window !== "undefined" ? localStorage.getItem(CURRENT_COMPANY_KEY) : null;
    
    if (storedAuth === "true" && storedCompany) {
      setIsAuthenticated(true);
      setCurrentCompany(storedCompany);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((companyName: string) => {
    setIsAuthenticated(true);
    setCurrentCompany(companyName);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STATUS_KEY, "true");
      localStorage.setItem(CURRENT_COMPANY_KEY, companyName);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentCompany(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STATUS_KEY);
      localStorage.removeItem(CURRENT_COMPANY_KEY);
      // Opcional: limpar o nome da empresa lembrado no login
      // localStorage.removeItem(REMEMBERED_COMPANY_NAME_KEY); 
    }
  }, []);

  const value = useMemo(() => ({ isAuthenticated, currentCompany, login, logout, isLoading }), [isAuthenticated, currentCompany, login, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
