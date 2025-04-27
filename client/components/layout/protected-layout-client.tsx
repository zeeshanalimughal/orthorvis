'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthService from '@/lib/services/auth.service';
import { User } from '@/lib/types/user.types';
import { Header } from '@/components/layout/header';

interface ProtectedLayoutClientProps {
  children: React.ReactNode;
}

export function ProtectedLayoutClient({ children }: ProtectedLayoutClientProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const response = await AuthService.getCurrentUser();
        if (response.user) {
          setUser(response.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 bg-muted/20">
        {children}
      </main>
    </div>
  );
}
