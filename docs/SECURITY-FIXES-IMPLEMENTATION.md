# Security Audit - Implementation Fixes

**Status**: CRITICAL VULNERABILITIES IDENTIFIED - FIXES REQUIRED BEFORE PRODUCTION

This document provides specific code changes to fix the critical vulnerabilities identified in the security audit.

---

## CRITICAL FIX #1: Document Authorization Checks

### Problem

Users can access and delete ANY document in the system by knowing its ID.

### Root Cause

`DocumentService.getDocument()` and `deleteDocument()` don't verify the user owns the document.

### Files to Update

- `services/DocumentService.ts`
- `app/api/documents/[id]/route.ts`
- `infrastructure/repositories/PrismaDocumentRepository.ts`

### Fix Implementation

#### Step 1: Update DocumentRepository Interface

**File**: `domain/repositories/DocumentRepository.ts`

```typescript
export interface DocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByReportId(
    reportId: string,
    includeDeleted?: boolean,
  ): Promise<Document[]>;
  findByHash(reportId: string, fileHash: string): Promise<Document | null>;

  // ADD THIS NEW METHOD:
  /**
   * Find document and verify it belongs to the given report
   */
  findByIdAndReportId(id: string, reportId: string): Promise<Document | null>;

  save(document: Document): Promise<Document>;
  delete(id: string): Promise<void>;
  search(reportId: string, query: string): Promise<Document[]>;
}
```

#### Step 2: Implement in PrismaDocumentRepository

**File**: `infrastructure/repositories/PrismaDocumentRepository.ts`

```typescript
export class PrismaDocumentRepository implements DocumentRepository {
  // ... existing methods ...

  // ADD THIS NEW METHOD:
  async findByIdAndReportId(
    id: string,
    reportId: string,
  ): Promise<Document | null> {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        reportId, // Must belong to this report
      },
    });
    return document;
  }
}
```

#### Step 3: Update DocumentService

**File**: `services/DocumentService.ts`

```typescript
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: FileStorageService,
    private parserService: ParserService,
    private reportRepository?: ReportRepository, // ADD THIS
  ) {}

  /**
   * Get a document by ID with authorization check
   * UPDATED: Now requires userId to verify ownership
   */
  async getDocument(id: string, userId: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new Error('Document not found');
    }

    // NEW: Verify user owns the report
    const report = await this.reportRepository?.findById(document.reportId);
    if (!report) {
      throw new Error('Document not found');
    }

    if (report.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return document;
  }

  /**
   * Delete a document (soft delete + remove file)
   * UPDATED: Now requires userId for authorization
   */
  async deleteDocument(id: string, userId: string): Promise<void> {
    // Authorization check included in getDocument
    const document = await this.getDocument(id, userId);

    // Delete file from storage
    await this.storageService.deleteFile(document.storagePath);

    // Soft delete record
    await this.documentRepository.delete(id);
  }

  /**
   * Update document metadata
   * UPDATED: Now requires userId for authorization
   */
  async updateDocument(
    id: string,
    userId: string,
    updates: { filename?: string; notes?: string },
  ): Promise<Document> {
    // Authorization check
    const document = await this.getDocument(id, userId);

    if (updates.filename !== undefined) {
      document.filename = updates.filename;
    }

    if (updates.notes !== undefined) {
      document.notes = updates.notes;
    }

    document.updatedAt = new Date();

    return await this.documentRepository.save(document);
  }

  // ... rest of methods ...
}
```

#### Step 4: Update API Endpoints

**File**: `app/api/documents/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DocumentService } from '@/services/DocumentService';
import { PrismaDocumentRepository } from '@/infrastructure/repositories/PrismaDocumentRepository';
import { FileStorageService } from '@/services/FileStorageService';
import { ParserService } from '@/services/ParserService';
import { PrismaReportRepository } from '@/infrastructure/repositories/PrismaReportRepository';
import { prisma } from '@/lib/db';

/**
 * GET /api/documents/[id] - Get a single document
 * FIXED: Now checks if user owns the document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Initialize service with dependencies (NOW WITH reportRepository)
  const documentService = new DocumentService(
    new PrismaDocumentRepository(prisma),
    new FileStorageService(),
    new ParserService(),
    new PrismaReportRepository(prisma), // ADD THIS
  );

  try {
    // FIXED: Pass userId for authorization check
    const document = await documentService.getDocument(
      params.id,
      session.user.id,
    );

    // Return document
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    // Handle authorization error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle "not found" error (404)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 * FIXED: Now checks if user owns the document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Initialize service
  const documentService = new DocumentService(
    new PrismaDocumentRepository(prisma),
    new FileStorageService(),
    new ParserService(),
    new PrismaReportRepository(prisma), // ADD THIS
  );

  try {
    // FIXED: Pass userId for authorization check
    await documentService.deleteDocument(params.id, session.user.id);

    // Return 204 No Content (successful deletion)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Handle authorization error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Handle "not found" error (404)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Re-throw unexpected errors
    throw error;
  }
}
```

### Testing

**File**: `__tests__/app/api/documents/[id]/route.test.ts` (NEW)

```typescript
/**
 * Tests for /api/documents/[id] endpoints (GET, DELETE)
 *
 * CRITICAL: Test authorization checks
 */

import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/documents/[id]/route';
import { getServerSession } from 'next-auth';
import {
  createMockDocument,
  createMockReport,
} from '@/__tests__/utils/factories';

jest.mock('next-auth');

// Mock services and repositories
jest.mock('@/lib/db', () => ({
  prisma: {
    document: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('GET /api/documents/[id]', () => {
  it("should return 403 when accessing another user's document", async () => {
    const userAId = 'user-a-id';
    const userBId = 'user-b-id';
    const docId = 'doc-123';

    // User A is trying to access document
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userAId },
    });

    // But the document belongs to User B
    const mockDoc = createMockDocument(docId, 'report-b-id');
    const mockReport = createMockReport('report-b-id', userBId);

    // Mock repository calls
    const { prisma } = require('@/lib/db');
    prisma.document.findUnique.mockResolvedValue(mockDoc);
    prisma.report.findUnique.mockResolvedValue(mockReport);

    const request = new NextRequest(
      'http://localhost:3000/api/documents/doc-123',
      {
        method: 'GET',
      },
    );

    const response = await GET(request, { params: { id: docId } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 200 when accessing own document', async () => {
    const userId = 'user-a-id';
    const docId = 'doc-123';
    const reportId = 'report-a-id';

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userId },
    });

    const mockDoc = createMockDocument(docId, reportId);
    const mockReport = createMockReport(reportId, userId);

    const { prisma } = require('@/lib/db');
    prisma.document.findUnique.mockResolvedValue(mockDoc);
    prisma.report.findUnique.mockResolvedValue(mockReport);

    const request = new NextRequest(
      'http://localhost:3000/api/documents/doc-123',
      {
        method: 'GET',
      },
    );

    const response = await GET(request, { params: { id: docId } });

    expect(response.status).toBe(200);
  });

  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/documents/doc-123',
      {
        method: 'GET',
      },
    );

    const response = await GET(request, { params: { id: 'doc-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });
});

describe('DELETE /api/documents/[id]', () => {
  it("should return 403 when deleting another user's document", async () => {
    const userAId = 'user-a-id';
    const userBId = 'user-b-id';
    const docId = 'doc-123';

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userAId },
    });

    const mockDoc = createMockDocument(docId, 'report-b-id');
    const mockReport = createMockReport('report-b-id', userBId);

    const { prisma } = require('@/lib/db');
    prisma.document.findUnique.mockResolvedValue(mockDoc);
    prisma.report.findUnique.mockResolvedValue(mockReport);

    const request = new NextRequest(
      'http://localhost:3000/api/documents/doc-123',
      {
        method: 'DELETE',
      },
    );

    const response = await DELETE(request, { params: { id: docId } });

    expect(response.status).toBe(403);
  });

  it('should return 204 when deleting own document', async () => {
    const userId = 'user-a-id';
    const docId = 'doc-123';
    const reportId = 'report-a-id';

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: userId },
    });

    const mockDoc = createMockDocument(docId, reportId);
    const mockReport = createMockReport(reportId, userId);

    const { prisma } = require('@/lib/db');
    prisma.document.findUnique.mockResolvedValue(mockDoc);
    prisma.report.findUnique.mockResolvedValue(mockReport);

    const request = new NextRequest(
      'http://localhost:3000/api/documents/doc-123',
      {
        method: 'DELETE',
      },
    );

    const response = await DELETE(request, { params: { id: docId } });

    expect(response.status).toBe(204);
  });
});
```

---

## CRITICAL FIX #2: Session Refresh Implementation

### Problem

`SessionHandler.handleRefresh()` calls `window.location.reload()` which doesn't actually refresh the server-side session.

### Root Cause

Page reload doesn't extend `expiresAt` in the database for database sessions.

### Fix Implementation

**File**: `components/SessionHandler.tsx`

```typescript
'use client';

import { useSession, signIn } from 'next-auth/react';
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
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          setShowExpirationWarning(false);
          router.push('/login');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, status, router]);

  // FIXED: Proper session refresh implementation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Option 1: Re-authenticate with email provider (requires user re-login)
      // Uncomment to use: await signIn('email', { email: session?.user?.email });

      // Option 2: Fetch new session from NextAuth (if session refresh is configured)
      const response = await fetch('/api/auth/session');

      if (response.ok) {
        // Update the session state
        const newSession = await response.json();
        await update(newSession);

        // Close the warning dialog
        setShowExpirationWarning(false);
      } else {
        // Session expired, redirect to login
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // On error, redirect to login for security
      router.push('/login');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setShowExpirationWarning(false);
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
          <Button
            variant='outline'
            onClick={handleSignOut}
            disabled={isRefreshing}
          >
            Sign Out
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration

**File**: `app/(app)/layout.tsx`

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppNav } from '@/components/layout/AppNav';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';
import { SessionHandler } from '@/components/SessionHandler';

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
        <AppLayoutClient>
          {children}
          {/* ADD THIS: SessionHandler to show expiration warnings */}
          <SessionHandler />
        </AppLayoutClient>
      </main>
    </div>
  );
}
```

---

## HIGH PRIORITY FIX #1: Reduce Session TTL

**File**: `lib/auth.ts`

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // ... existing configuration ...
    }),
  ],
  callbacks: {
    // ... existing callbacks ...
  },
  pages: {
    // ... existing pages ...
  },
  session: {
    strategy: 'database',
    maxAge: 7 * 24 * 60 * 60, // CHANGED: 7 days (was 30)
    updateAge: 24 * 60 * 60, // NEW: Refresh session daily on activity
  },
};
```

---

## HIGH PRIORITY FIX #2: Rate Limiting

### Implementation using middleware

**File**: `lib/rateLimit.ts` (NEW)

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis rate limiter
const redis = Redis.fromEnv();

const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  prefix: 'ratelimit:login',
});

const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  prefix: 'ratelimit:api',
});

export async function checkLoginLimit(email: string) {
  const { success } = await loginLimiter.limit(email);
  if (!success) {
    throw new Error('Too many login attempts. Please try again later.');
  }
}

export async function checkAPILimit(userId: string) {
  const { success } = await apiLimiter.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
}
```

### Alternative: Using Redis/Memory

If Upstash is not available, use a simpler in-memory approach:

**File**: `lib/rateLimitMemory.ts` (NEW)

```typescript
const loginAttempts = new Map<string, number[]>();
const apiCalls = new Map<string, number[]>();

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

const API_LIMIT = 100;
const API_WINDOW = 60 * 1000; // 1 minute

function cleanOldAttempts(attempts: number[], window: number) {
  const now = Date.now();
  return attempts.filter((time) => now - time < window);
}

export function checkLoginLimit(email: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || [];
  const recentAttempts = cleanOldAttempts(attempts, LOGIN_WINDOW);

  if (recentAttempts.length >= LOGIN_LIMIT) {
    return false; // Rate limit exceeded
  }

  recentAttempts.push(now);
  loginAttempts.set(email, recentAttempts);
  return true;
}

export function checkAPILimit(userId: string): boolean {
  const now = Date.now();
  const calls = apiCalls.get(userId) || [];
  const recentCalls = cleanOldAttempts(calls, API_WINDOW);

  if (recentCalls.length >= API_LIMIT) {
    return false; // Rate limit exceeded
  }

  recentCalls.push(now);
  apiCalls.set(userId, recentCalls);
  return true;
}
```

### Usage in API Endpoints

**File**: `app/api/reports/route.ts`

```typescript
import { checkAPILimit } from '@/lib/rateLimitMemory';

export async function GET(_request: NextRequest) {
  try {
    // Rate limiting check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkAPILimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    // ... rest of endpoint ...
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

---

## SUMMARY OF CHANGES

### Files to Create

1. `lib/rateLimitMemory.ts` - Rate limiting utility
2. `__tests__/app/api/documents/[id]/route.test.ts` - Authorization tests
3. `domain/repositories/DocumentRepository.ts` - Update interface

### Files to Update

1. `services/DocumentService.ts` - Add userId parameter to methods
2. `infrastructure/repositories/PrismaDocumentRepository.ts` - Add findByIdAndReportId
3. `app/api/documents/[id]/route.ts` - Add authorization checks
4. `components/SessionHandler.tsx` - Fix session refresh
5. `app/(app)/layout.tsx` - Integrate SessionHandler
6. `lib/auth.ts` - Reduce maxAge and add updateAge

### Estimated Implementation Time

- Authorization fixes: 2-3 hours
- Session refresh: 1 hour
- Rate limiting: 1-2 hours
- Testing: 1-2 hours
- **Total: 5-8 hours**

### Testing Checklist

- [ ] Authorization tests pass for documents
- [ ] Session refresh button works correctly
- [ ] Rate limiting blocks excess requests
- [ ] Session TTL is 7 days
- [ ] SessionHandler displays expiration warning
- [ ] All existing tests still pass

---

## DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All critical fixes implemented and tested
- [ ] Authorization tests have 100% coverage
- [ ] Rate limiting configured for production (Redis/Upstash)
- [ ] Session TTL reduced to 7 days
- [ ] NEXTAUTH_SECRET is cryptographically random
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Security review completed
- [ ] Penetration testing scheduled
