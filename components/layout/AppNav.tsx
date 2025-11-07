/**
 * AppNav Component
 *
 * Navigation bar for authenticated app pages.
 */

'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AppNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppNav({ user }: AppNavProps) {
  return (
    <nav className='border-b bg-white p-4'>
      <div className='container mx-auto flex items-center justify-between'>
        <div className='flex items-center gap-6'>
          <Link href='/reports'>
            <h1 className='text-xl font-bold'>Apex</h1>
          </Link>
          <Link
            href='/reports'
            className='text-sm text-gray-600 hover:text-gray-900'
          >
            Reports
          </Link>
        </div>
        <div className='flex items-center gap-4'>
          <span className='text-sm text-gray-600'>
            {user.name || user.email}
          </span>
          <Button variant='outline' onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
