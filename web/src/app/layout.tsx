import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "../lib/apollo-wrapper";
import { AuthProvider } from "../lib/auth-context";
import { LegacyRedirect } from "../components/LegacyRedirect";
import { CollectionChat } from "../components/CollectionChat";
import { AppFooter } from "../components/AppFooter";
import { UmamiScript } from "../components/UmamiScript";
import { TranslationProvider } from "../i18n/context";
import { getTranslations } from "../i18n";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "InventoryDifferent",
  description: "Track your collection",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = process.env.LANGUAGE ?? "en";
  const translations = getTranslations(lang);

  return (
    <html lang={lang}>
      <body className={`${inter.className} antialiased`}>
        <TranslationProvider translations={translations}>
          <AuthProvider>
            <ApolloWrapper>
              <LegacyRedirect />
              <div className="container mx-auto p-4">
                {children}
              </div>
              <CollectionChat />
              <AppFooter />
            </ApolloWrapper>
          </AuthProvider>
        </TranslationProvider>
        <UmamiScript />
      </body>
    </html>
  );
}
