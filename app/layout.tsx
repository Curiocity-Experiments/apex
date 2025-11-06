import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apex - Research Document Management',
  description: 'Document management platform for financial analysts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
