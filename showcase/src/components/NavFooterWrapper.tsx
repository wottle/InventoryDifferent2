"use client";

import { usePathname } from 'next/navigation';
import Nav from './Nav';
import Footer from './Footer';

interface Props {
  siteTitle: string;
}

export function NavWrapper({ siteTitle }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <Nav siteTitle={siteTitle} />;
}

export function FooterWrapper({ siteTitle }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <Footer siteTitle={siteTitle} />;
}

// Keep default export for any existing imports
export default function NavFooterWrapper({ siteTitle }: Props) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return (
    <>
      <Nav siteTitle={siteTitle} />
      <Footer siteTitle={siteTitle} />
    </>
  );
}
