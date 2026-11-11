import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classmate',
  description: 'AI-powered class homework and productivity platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
