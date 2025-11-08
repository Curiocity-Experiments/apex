/**
 * NextAuth Configuration
 *
 * Configures authentication using magic link email (Resend).
 * No passwords - users receive a one-time link via email.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 3: Authentication
 * @see https://next-auth.js.org/configuration/providers/email
 */

import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  // Don't use adapter in development (CredentialsProvider requires JWT sessions)
  adapter: process.env.NODE_ENV === 'development' ? undefined : PrismaAdapter(prisma),
  providers: [
    // Development-only: Email login without magic link
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            id: 'dev-login',
            name: 'Development Login',
            credentials: {
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              // Find or create user for development
              const user = await prisma.user.upsert({
                where: { email: credentials.email },
                update: {},
                create: {
                  email: credentials.email,
                  name: credentials.email.split('@')[0],
                  provider: 'dev',
                },
              });

              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            },
          }),
        ]
      : []),
    EmailProvider({
      server: '', // Not used with Resend
      from: process.env.RESEND_FROM_EMAIL || 'noreply@apex.dev',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@apex.dev',
            to: email,
            subject: 'Sign in to Apex',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Sign in to Apex</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb;">Sign in to Apex</h1>
                    <p>Click the button below to sign in to your Apex account:</p>
                    <div style="margin: 30px 0;">
                      <a href="${url}"
                         style="background-color: #2563eb; color: white; padding: 12px 24px;
                                text-decoration: none; border-radius: 6px; display: inline-block;">
                        Sign in to Apex
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                      This link will expire in 24 hours and can only be used once.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </div>
                </body>
              </html>
            `,
          });
        } catch (error) {
          console.error('Failed to send magic link email:', error);
          throw new Error('Failed to send verification email');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user id to JWT token on sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, user, token }) {
      // Add user id to session from either database user or JWT token
      if (session.user) {
        session.user.id = user?.id || token?.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/auth/error',
  },
  session: {
    // Use JWT in development (required for CredentialsProvider), database in production
    strategy: process.env.NODE_ENV === 'development' ? 'jwt' : 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
