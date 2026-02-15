import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "../lib/apollo-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shop - InventoryDifferent",
  description: "Browse vintage Apple devices for sale",
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
        <ApolloWrapper>
          <div className="min-h-screen">
            {children}
          </div>
        </ApolloWrapper>
      </body>
    </html>
  );
}
