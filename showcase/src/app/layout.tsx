import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'The Collection',
  description: 'A curated showcase of vintage computers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
