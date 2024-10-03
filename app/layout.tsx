import './globals.css';
import { Inter } from 'next/font/google';
import Layout from '@/components/Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { FcmHandler } from '../components/FcmHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'elTrackEz',
  description: "ElTrackEZ is your intuitive project management tool designed for effortless tracking and seamless collaboration. Simplify your workflow, manage tasks with ease, and elevate your team's productivity—all in one place. Experience a stress-free approach to project management and stay organized with ElTrackEZ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Layout>
              <FcmHandler />
              {children}
            </Layout>
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}