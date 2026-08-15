"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useAuth } from '@/lib/auth-context';

interface NavProps {
  siteTitle: string;
}

export default function Nav({ siteTitle }: NavProps) {
  const pathname = usePathname();
  const t = useT();
  const { isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const adminHref = isAuthenticated ? '/admin/journeys' : '/admin/login';

  const links = [
    { href: '/journeys', label: t.nav.journeys },
    { href: '/timeline', label: t.nav.timeline },
    { href: '/#about', label: t.nav.about },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm glass-nav">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter text-on-surface uppercase hover:text-primary transition-colors duration-200"
        >
          {siteTitle}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive =
              link.href.startsWith('#') || !pathname
                ? false
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? 'tracking-tight text-sm font-medium uppercase text-primary border-b-2 border-primary pb-1 transition-all duration-200'
                    : 'tracking-tight text-sm font-medium uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-200'
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Explore button — desktop only */}
          <Link
            href="/journeys"
            className="hidden md:inline-flex bg-primary text-on-primary px-6 py-2 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
          >
            {t.nav.explore}
          </Link>

          {/* Admin icon — desktop only */}
          {!isLoading && (
            <Link
              href={adminHref}
              className="hidden md:flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-on-surface transition-colors duration-200"
              title={isAuthenticated ? 'Admin' : 'Login'}
            >
              {isAuthenticated ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              )}
            </Link>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors touch-manipulation"
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-outline-variant/10 shadow-lg transition-opacity duration-150 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col px-8 py-4 gap-1 max-w-7xl mx-auto">
          {links.map((link) => {
            const isActive =
              link.href.startsWith('#') || !pathname
                ? false
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`py-4 text-sm font-medium uppercase tracking-tight border-b border-outline-variant/10 last:border-0 transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 pb-2 flex flex-col gap-2">
            <Link
              href="/journeys"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-primary text-on-primary px-6 py-3 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
            >
              {t.nav.explore}
            </Link>
            {!isLoading && (
              <Link
                href={adminHref}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center border border-outline-variant/30 text-on-surface-variant px-6 py-3 rounded-full font-medium text-sm hover:bg-surface-container transition-all duration-200 active:scale-95"
              >
                {isAuthenticated ? 'Admin' : 'Login'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
