"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_LINKS = [
  { label: 'Journeys', href: '/admin/journeys', icon: '📖' },
  { label: 'Quotes', href: '/admin/quotes', icon: '💬' },
  { label: 'Appearance', href: '/admin/appearance', icon: '🎨' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, router, isLoginPage]);

  // Login page: render children directly with no auth guard or sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-lowest shadow-sm flex flex-col p-6 shrink-0">
        {/* Logo / Wordmark */}
        <div className="mb-8">
          <p className="text-[0.6875rem] font-label uppercase tracking-widest text-outline mb-1">Admin</p>
          <Link
            href="/admin/journeys"
            className="text-lg font-headline font-bold tracking-tight text-on-surface hover:text-primary transition"
          >
            The Collection
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'text-primary font-semibold bg-primary/8'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/30">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition"
          >
            <span className="text-base">↗</span>
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-error/10 hover:text-error transition text-left"
          >
            <span className="text-base">→</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
