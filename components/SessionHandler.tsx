'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function SessionHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);

  useEffect(() => {
    // If session is unauthenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Check session expiration every 60 seconds
    const interval = setInterval(() => {
      if (status === 'authenticated' && session?.expires) {
        const expiresAt = new Date(session.expires);
        const now = new Date();
        const timeUntilExpiration = expiresAt.getTime() - now.getTime();

        // Show warning 5 minutes before expiration
        const fiveMinutesInMs = 5 * 60 * 1000;

        if (timeUntilExpiration > 0 && timeUntilExpiration <= fiveMinutesInMs) {
          setShowExpirationWarning(true);
        }

        // Session expired
        if (timeUntilExpiration <= 0) {
          router.push('/login');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, status, router]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignOut = () => {
    router.push('/login');
  };

  return (
    <Dialog
      open={showExpirationWarning}
      onOpenChange={setShowExpirationWarning}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in less than 5 minutes. Please refresh to
            continue your work or sign out.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={handleSignOut}>
            Sign Out
          </Button>
          <Button onClick={handleRefresh}>Refresh Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
