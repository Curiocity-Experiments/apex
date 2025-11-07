/**
 * NextAuth API Handler
 *
 * Handles all authentication routes via NextAuth.
 * Routes: /api/auth/signin, /api/auth/signout, /api/auth/callback, etc.
 *
 * @see lib/auth.ts for configuration
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
