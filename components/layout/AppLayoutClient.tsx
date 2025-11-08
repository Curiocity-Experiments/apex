'use client';

import { SessionHandler } from '@/components/SessionHandler';

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionHandler />
      {children}
    </>
  );
}
