'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-red-600'>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-600'>
            An unexpected error occurred. Please try again.
          </p>
          {error.message && (
            <details className='rounded-md bg-gray-50 p-3 text-xs'>
              <summary className='cursor-pointer font-medium text-gray-700'>
                Error details
              </summary>
              <pre className='mt-2 overflow-auto text-gray-600'>
                {error.message}
              </pre>
              {error.digest && (
                <p className='mt-2 text-gray-500'>Digest: {error.digest}</p>
              )}
            </details>
          )}
          <div className='flex gap-2'>
            <Button onClick={reset} variant='outline'>
              Try again
            </Button>
            <Button onClick={() => (window.location.href = '/reports')}>
              Go to Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
