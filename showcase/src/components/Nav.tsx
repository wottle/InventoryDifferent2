"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  siteTitle: string;
}

export default function Nav({ siteTitle }: NavProps) {
  const pathname = usePathname();

  const links = [
    { href: '/journeys', label: 'Journeys' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/#about', label: 'About' },
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

        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive = link.href.startsWith('#')
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
          <Link
            href="/journeys"
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
          >
            Explore
          </Link>
        </div>
      </div>
    </nav>
  );
}
