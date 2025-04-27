import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get('token');

  if (!token) {
    redirect('/login');
  }

  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
