import './globals.css';
import { Inter } from 'next/font/google';
import Layout from '@/components/Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI 100',
  description: 'Created using OpenAI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Layout>
            {children}
          </Layout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}