"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('sk_auth_token');
    if (!savedToken && !token) {
      router.push('/login');
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, user, allowedRoles, router, token]);

  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('sk_auth_token');
    if (!savedToken && !token) {
      router.push('/login');
      return null;
    }
  }

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
