import './globals.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_KR, Noto_Serif_KR } from 'next/font/google';

// Two typefaces, each with one job. Both cover Korean and Latin.
const body = IBM_Plex_Sans_KR({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const display = Noto_Serif_KR({
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Classmate',
  description: 'Homework, calendar and announcements for your class.',
};

export const viewport: Viewport = {
  themeColor: '#f5f2ea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
