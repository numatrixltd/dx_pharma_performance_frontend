'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import { PageSkeleton } from '@/components/ui/States';

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="mx-auto max-w-6xl p-6"><PageSkeleton /></div>;
  }
  return <AppShell>{children}</AppShell>;
}
