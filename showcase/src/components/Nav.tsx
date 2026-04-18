"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/context';

interface NavProps {
  siteTitle: string;
}

export default function Nav({ siteTitle }: NavProps) {
  const pathname = usePathname();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);

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
          <div className="pt-4 pb-2">
            <Link
              href="/journeys"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-primary text-on-primary px-6 py-3 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
            >
              {t.nav.explore}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
