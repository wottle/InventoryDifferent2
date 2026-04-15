import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
import { AuthProvider } from '@/lib/auth-context';
import { getClient } from '@/lib/apollo-rsc';
import { GET_SHOWCASE_CONFIG } from '@/lib/queries';
import { NavWrapper, FooterWrapper } from '@/components/NavFooterWrapper';
import { TranslationProvider } from '@/i18n/context';
import { getTranslations } from '@/i18n';
import { UmamiScript } from '@/components/UmamiScript';

export const metadata: Metadata = {
  title: 'The Collection',
  description: 'A curated showcase of vintage computers',
};

interface ShowcaseConfig {
  siteTitle: string;
  tagline: string;
  bioText: string;
  heroImagePath: string | null;
  accentColor: string;
  timelineCuratorNote: string;
}

const DEFAULT_CONFIG: Pick<ShowcaseConfig, 'siteTitle' | 'tagline'> = {
  siteTitle: 'The Collection',
  tagline: '',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = process.env.LANGUAGE ?? 'en';
  const t = getTranslations(locale);
  let siteTitle = DEFAULT_CONFIG.siteTitle;

  try {
    const { data } = await getClient().query<{ showcaseConfig: ShowcaseConfig | null }>({
      query: GET_SHOWCASE_CONFIG,
    });
    if (data?.showcaseConfig?.siteTitle) {
      siteTitle = data.showcaseConfig.siteTitle;
    }
  } catch {
    // Fall back to default if API is unavailable
  }

  return (
    <html lang={locale}>
      <body className="bg-surface text-on-surface selection:bg-primary/20 selection:text-primary">
        <ApolloWrapper>
          <AuthProvider>
            <TranslationProvider translations={t} locale={locale}>
            <NavWrapper siteTitle={siteTitle} />
            <div className="pt-[68px]">
              {children}
            </div>
            <FooterWrapper siteTitle={siteTitle} />
            </TranslationProvider>
          </AuthProvider>
        </ApolloWrapper>
        <UmamiScript />
      </body>
    </html>
  );
}
