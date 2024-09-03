// app/ServerLayout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { clientConfig, serverConfig } from "../config";
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI 100',
  description: 'Created using OpenAI',
};

export default async function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  const email = tokens?.decodedToken?.email;

  return (
    <html lang="en">
      <body className={inter.className}>
        {email ? (
          <ClientLayout>
            {children}
          </ClientLayout>
        ) : (
          <div className="flex justify-center items-center min-h-screen">
            {children}
          </div>
        )}
        <Toaster />
      </body>
    </html>
  );
}