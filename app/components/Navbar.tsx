'use client';

import Link from 'next/link';
import { useAuth } from '../auth-provider';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                Food Picks
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-muted-foreground hover:border-gray-300 dark:hover:border-border hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/food-fights"
                  className="border-transparent text-muted-foreground hover:border-gray-300 dark:hover:border-border hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Food Fights
                </Link>
              )}
              <Link
                href="/history"
                className="border-transparent text-muted-foreground hover:border-gray-300 dark:hover:border-border hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                History
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-3">
                <Link
                  href="/login"
                  className="border border-transparent text-muted-foreground hover:text-foreground py-2 px-3 text-sm font-medium rounded-md"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-3 text-sm font-medium rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 