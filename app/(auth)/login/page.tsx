/**
 * Login Page
 *
 * Allows users to sign in using magic link email authentication.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 5: Pages
 */

'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    // Use dev-login in development (no email sent), email provider in production
    const provider =
      process.env.NODE_ENV === 'development' ? 'dev-login' : 'email';
    await signIn(provider, { email, callbackUrl: '/reports' });
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <Card className='w-full max-w-md p-8'>
        <h1 className='mb-6 text-3xl font-bold'>Sign in to Apex</h1>
        <p className='mb-6 text-sm text-gray-600'>
          Enter your email to receive a magic link
        </p>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input
            type='email'
            placeholder='your@email.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? 'Sending link...' : 'Send magic link'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
