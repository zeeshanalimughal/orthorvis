'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/lib/types/user.types';
import AuthService from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListTodo, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '../theme-toggle';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/context/auth-context';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme } = useTheme()
  const isDashboard = pathname === '/dashboard';
  const { logout } = useAuth()
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout()
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'There was a problem logging out. Please try again.',
        variant: 'destructive',
      });
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className={cn("border-b bg-primary", theme == "dark" && "bg-zinc-950")}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/assets/logo.png"
              alt="OrthoRVIS Logo"
              width={236}
              height={66}
              priority
            />
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2 mr-2">
              <ThemeToggle />
              <TooltipProvider>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="text-amber-400 hover:text-amber-400 hover:bg-blue/10">
                      <Link href="/cases/create">
                        <PlusCircle className="h-8 w-8" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add New Case</p>
                  </TooltipContent>
                </Tooltip>

                {!isDashboard && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild className="text-amber-400 hover:text-amber-400 hover:bg-blue/10">
                        <Link href="/dashboard">
                          <ListTodo className="h-8 w-8" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cases List</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="text-amber-400 hover:text-amber-400 hover:bg-blue/10">
                      <Link href="#">
                        <HelpCircle className="h-8 w-8" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Help</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <span className="font-medium">{user.fullName}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
