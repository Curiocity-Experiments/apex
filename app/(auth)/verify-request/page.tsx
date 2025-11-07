/**
 * Verify Request Page
 *
 * Shown after user requests a magic link.
 */

import { Card } from '@/components/ui/card';

export default function VerifyRequestPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <Card className='w-full max-w-md p-8 text-center'>
        <h1 className='mb-4 text-2xl font-bold'>Check your email</h1>
        <p className='text-gray-600'>
          A sign-in link has been sent to your email address. Click the link to
          sign in.
        </p>
        <p className='mt-4 text-sm text-gray-500'>You can close this window.</p>
      </Card>
    </div>
  );
}
