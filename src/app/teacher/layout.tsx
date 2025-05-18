"use client";

import { AppShell } from '@/components/shared/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userData?.role !== 'teacher') {
        // If logged in user is not a teacher, redirect them appropriately
        // For now, redirect to home, which might then redirect to student page or login
        router.replace('/'); 
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.role !== 'teacher') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return <AppShell role="teacher">{children}</AppShell>;
}
