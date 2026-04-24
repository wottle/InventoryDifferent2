'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useT } from "../i18n/context";

const MAIN_NAV = [
  { key: 'devices' as const,    href: '/list-new',   icon: 'devices' },
  { key: 'financials' as const, href: '/financials', icon: 'payments' },
  { key: 'wishlist' as const,   href: '/wishlist',   icon: 'auto_awesome_motion' },
];

type MoreItem = { key: string; href: string; icon: string };

const MORE_ITEMS: MoreItem[] = [
  { key: 'stats',          href: '/stats',            icon: 'bar_chart' },
  { key: 'timeline',       href: '/timeline',         icon: 'timeline' },
  { key: 'usage',          href: '/usage',            icon: 'storage' },
];

const MORE_TOOLS: MoreItem[] = [
  { key: 'printList',      href: '/print',            icon: 'print' },
  { key: 'exportImport',   href: '/backup',           icon: 'import_export' },
  { key: 'aiProductImages',href: '/generate-images',  icon: 'auto_awesome' },
];

const MORE_MANAGE: MoreItem[] = [
  { key: 'manageCategories',   href: '/categories',   icon: 'category' },
  { key: 'manageLocations',    href: '/locations',    icon: 'location_on' },
  { key: 'manageTemplates',    href: '/templates',    icon: 'content_copy' },
  { key: 'manageCustomFields', href: '/customFields', icon: 'tune' },
];

const MORE_ADMIN: MoreItem[] = [
  { key: 'trash',              href: '/trash',        icon: 'delete' },
];

export function NavBar() {
  const t = useT();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isDevicesActive = pathname === '/list-new' || pathname === '/';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#f9f9fe]/80 dark:bg-[#111318]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="InventoryDifferent" width={32} height={32} />
            <h1 className="text-2xl font-light tracking-tight">
              <span style={{ color: '#5EBD3E' }}>Inv</span>
              <span style={{ color: '#FFB900' }}>ent</span>
              <span style={{ color: '#F78200' }}>ory</span>
              <span style={{ color: '#E23838' }}>Dif</span>
              <span style={{ color: '#973999' }}>fer</span>
              <span style={{ color: '#009CDF' }}>ent</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {MAIN_NAV.map(item => {
              const isActive = item.key === 'devices' ? isDevicesActive : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    isActive
                      ? "text-primary dark:text-[#adc6ff] font-bold border-b-2 border-primary dark:border-[#adc6ff] pb-1"
                      : "text-on-surface-variant hover:text-primary dark:text-[#c1c6d7] dark:hover:text-[#adc6ff] transition-colors"
                  }
                >
                  {t.nav[item.key]}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={`flex items-center gap-1 transition-colors ${
                  moreOpen
                    ? 'text-primary dark:text-[#adc6ff]'
                    : 'text-on-surface-variant hover:text-primary dark:text-[#c1c6d7] dark:hover:text-[#adc6ff]'
                }`}
              >
                {t.nav.more}
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {moreOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-3 z-50 bg-surface-container-lowest dark:bg-[#1e2129] rounded-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] py-2 w-52 border border-outline-variant/10">
                  {MORE_ITEMS.map(item => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary dark:text-[#adc6ff] bg-primary/5 dark:bg-[#adc6ff]/5 font-medium'
                          : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7] hover:bg-surface-container dark:hover:bg-[#282d36]'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                      {(t.nav as Record<string, string>)[item.key]}
                    </Link>
                  ))}
                  <div className="my-1.5 border-t border-outline-variant/10" />
                  {MORE_TOOLS.map(item => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary dark:text-[#adc6ff] bg-primary/5 dark:bg-[#adc6ff]/5 font-medium'
                          : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7] hover:bg-surface-container dark:hover:bg-[#282d36]'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                      {(t.nav as Record<string, string>)[item.key]}
                    </Link>
                  ))}
                  <div className="my-1.5 border-t border-outline-variant/10" />
                  {MORE_MANAGE.map(item => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary dark:text-[#adc6ff] bg-primary/5 dark:bg-[#adc6ff]/5 font-medium'
                          : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7] hover:bg-surface-container dark:hover:bg-[#282d36]'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                      {(t.nav as Record<string, string>)[item.key]}
                    </Link>
                  ))}
                  <div className="my-1.5 border-t border-outline-variant/10" />
                  {MORE_ADMIN.map(item => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary dark:text-[#adc6ff] bg-primary/5 dark:bg-[#adc6ff]/5 font-medium'
                          : 'text-on-surface-variant dark:text-[#c1c6d7] hover:text-on-surface dark:hover:text-[#e2e2e7] hover:bg-surface-container dark:hover:bg-[#282d36]'
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
                      {(t.nav as Record<string, string>)[item.key]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/categories"
              className="p-2 rounded-full hover:bg-surface-container dark:hover:bg-[#1e2129] text-on-surface-variant dark:text-[#c1c6d7] transition-colors"
              title={t.nav.manageCategories}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 md:hidden bg-white/90 dark:bg-[#1a1c1f]/90 backdrop-blur-2xl rounded-t-3xl shadow-[0_-4px_20px_0_rgba(0,0,0,0.04)]">
        {MAIN_NAV.map(item => {
          const isActive = item.key === 'devices' ? isDevicesActive : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center ${isActive ? 'text-primary dark:text-[#adc6ff] scale-110' : 'text-outline-variant dark:text-[#414755]'} transition-all`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold mt-1">
                {t.nav[item.key]}
              </span>
            </Link>
          );
        })}
        <Link
          href="/stats"
          className="flex flex-col items-center justify-center text-outline-variant dark:text-[#414755]"
        >
          <span className="material-symbols-outlined">more_horiz</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-1">{t.nav.more}</span>
        </Link>
      </nav>

      {/* Desktop FAB */}
      <div className="fixed bottom-12 right-12 hidden md:block z-40">
        <Link href="/devices/new">
          <button className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">add</span>
          </button>
        </Link>
      </div>
    </>
  );
}
