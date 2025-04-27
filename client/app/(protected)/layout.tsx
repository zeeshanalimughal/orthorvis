import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client';
import { checkAuthAction } from '../actions/auth.actions';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = await checkAuthAction()

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
