'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/**
 * Redirects to /login when auth is required and the user is not signed in.
 * Returns true while the outcome is still being determined (auth loading or redirect pending),
 * so pages can return a loading panel instead of rendering with missing data.
 */
export function useRequireAuth(): boolean {
  const { isAuthenticated, isLoading, authRequired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && authRequired && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, authRequired, router]);

  return isLoading || (authRequired && !isAuthenticated);
}
