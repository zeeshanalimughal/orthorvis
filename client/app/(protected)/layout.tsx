import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client';
import { checkAuthAction } from '../actions/auth.actions';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = await checkAuthAction()

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
