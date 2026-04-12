"use client";

import { usePathname } from 'next/navigation';
import Nav from './Nav';
import Footer from './Footer';

interface NavFooterWrapperProps {
  siteTitle: string;
}

export default function NavFooterWrapper({ siteTitle }: NavFooterWrapperProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return (
    <>
      <Nav siteTitle={siteTitle} />
      <Footer siteTitle={siteTitle} />
    </>
  );
}
