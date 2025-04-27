'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '../services/auth.service';
import { toast } from 'sonner';
import { getToken, loginAction, logoutAction, registerAction } from '@/app/actions/auth.actions';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/login' || path === '/register') {
          return false;
        }
      }
      const token = await getToken()
      const response = await AuthService.getCurrentUser(token || '');

      if (response.user) {
        setUser(response.user);
        return true;
      } else {
        console.log('No user data in response');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginAction({ email, password });
      if (data) {
        setUser(data.user);
        toast.success(data.message || 'Login successful');
        router.push('/dashboard');
      }
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const { data } = await registerAction({ fullName, email, password });
      if (data) {
        setUser(user);
        toast.success(data.message || 'Registration successful');
        router.push('/dashboard');
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const token = await getToken()
      await AuthService.logout(token || '');
      await logoutAction()
      toast.success('Logout successful');
      setTimeout(() => {
        setUser(null);
        router.push('/login');
      }, 1000)
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Logout failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
