"use client";

import { useT } from '@/i18n/context';

interface FooterProps {
  siteTitle: string;
}

export default function Footer({ siteTitle }: FooterProps) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-low border-t border-surface-variant w-full py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
        <div className="text-lg font-black text-on-surface uppercase tracking-tighter">
          {siteTitle}
        </div>
        <div className="font-sans text-xs font-light tracking-wide text-on-surface-variant">
          {t.footer.poweredBy} <a href="https://github.com/wottle/InventoryDifferent2" target="_blank" className="text-primary hover:underline">InventoryDifferent</a>
        </div>
        <div className="font-sans text-xs font-light tracking-wide text-on-surface-variant">
          © {year} {siteTitle}
        </div>
      </div>
    </footer>
  );
}
