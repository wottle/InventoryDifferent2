import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "../lib/apollo-wrapper";
import { AuthProvider } from "../lib/auth-context";
import { LegacyRedirect } from "../components/LegacyRedirect";
import { CollectionChat } from "../components/CollectionChat";
import { UmamiScript } from "../components/UmamiScript";

const inter = Inter({ subsets: ["latin"] });

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
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ApolloWrapper>
            <LegacyRedirect />
            <div className="container mx-auto p-4">
              {children}
            </div>
            <CollectionChat />
          </ApolloWrapper>
        </AuthProvider>
        <UmamiScript />
      </body>
    </html>
  );
}
