/**
 * App Layout
 *
 * Layout for authenticated pages with navigation and auth check.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 5: Layouts
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppNav } from '@/components/layout/AppNav';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AppNav user={session.user} />
      <main>
        <AppLayoutClient>{children}</AppLayoutClient>
      </main>
    </div>
  );
}
