"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (userData: any, token: string, redirectPath?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Clear legacy keys to force clean professional state
    const legacyKeys = ['Professional_token', 'Professional_user', 'tactical_token', 'tactical_user'];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    // Restore session from localStorage
    const savedToken = localStorage.getItem('sk_auth_token');
    const savedUser = localStorage.getItem('sk_auth_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: any, authToken: string, redirectPath?: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('sk_auth_token', authToken);
    localStorage.setItem('sk_auth_user', JSON.stringify(userData));
    
    // Redirect based on role
    if (userData.role === 'admin') {
      router.push('/admin');
    } else if (userData.role === 'technician') {
      router.push('/technician');
    } else if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.push('/');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sk_auth_token');
    localStorage.removeItem('sk_auth_user');
    window.location.href = '/login'; // Force full reload to clear all states
  };

  const refreshUser = async () => {
    try {
      const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (data.ok) {
        const userData = await data.json();
        setUser(userData);
        localStorage.setItem('sk_auth_user', JSON.stringify(userData));
      }
    } catch (e) {
      console.error("Failed to refresh user:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token, isLoading }}>
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
