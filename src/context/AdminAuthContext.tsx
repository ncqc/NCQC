'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  checkServerSession, 
  authenticateAdmin, 
  logoutAdmin,
  LoginResult 
} from '@/lib/adminAuth';

interface AdminUser {
  email: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    const result = await checkServerSession();
    if (result.authenticated && result.user) {
      setUser(result.user);
    } else {
      setUser(null);
      if (result.concurrentSession) {
        alert('⚠️ Session Terminated: Your administrator account was accessed from another device. You have been automatically logged out on this device.');
        window.location.href = '/admin/login';
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshSession();

    // Heartbeat check every 15 seconds to ensure single active device session
    const interval = setInterval(async () => {
      const result = await checkServerSession();
      if (!result.authenticated && result.concurrentSession) {
        setUser(null);
        alert('⚠️ Session Terminated: Your administrator account was accessed from another device. You have been automatically logged out on this device.');
        window.location.href = '/admin/login';
      }
    }, 15000);

    const onFocus = () => {
      checkServerSession().then(result => {
        if (!result.authenticated && result.concurrentSession) {
          setUser(null);
          alert('⚠️ Session Terminated: Your administrator account was accessed from another device.');
          window.location.href = '/admin/login';
        }
      });
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshSession]);

  const handleLogin = async (email: string, pass: string, rememberMe: boolean = true): Promise<LoginResult> => {
    const result = await authenticateAdmin(email, pass, rememberMe);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        refreshSession
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
