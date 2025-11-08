# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Commands](#development-commands)
- [Architecture](#architecture)
- [Code Conventions](#code-conventions)
- [Architecture Patterns](#architecture-patterns)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Known Issues](#known-issues)
- [Additional Resources](#additional-resources)

## Project Overview

Apex is a Next.js application for research document management with AI-powered parsing capabilities. Built for financial analysts to organize research reports, upload documents, and leverage intelligent document processing.

**Tech Stack:** Next.js 14, TypeScript, PostgreSQL, Prisma, NextAuth, Tailwind CSS

## Development Commands

### Running the Application

```bash
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm start            # Start production server
```

### Local Development Setup

```bash
npm run local:setup         # Complete local setup (one command)
npm run local:db:start      # Start PostgreSQL container
npm run local:db:stop       # Stop PostgreSQL container
npm run local:db:reset      # Reset database and reseed
```

### Testing and Linting

```bash
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Database Management

```bash
npx prisma studio           # Open Prisma Studio (database GUI)
npx prisma migrate dev      # Create new migration
npx prisma generate         # Generate Prisma Client
npm run db:seed             # Seed database with sample data
```

## Architecture

### Clean Architecture

The application follows Clean Architecture principles:

```
Presentation Layer (React Components)
         ↓
   Use Cases (Business Logic)
         ↓
 Repository Interfaces (Contracts)
         ↓
Prisma Repositories (Implementation)
         ↓
   PostgreSQL Database
```

**Directory Structure:**
- `domain/` - Business logic (entities, repositories, use-cases)
- `infrastructure/` - Implementation details (Prisma repositories)
- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Shared utilities (db.ts for Prisma client, auth.ts for NextAuth)

### Data Model

The application uses **content deduplication** for efficient storage.

#### Core Models (see `prisma/schema.prisma`)

- **User**: User account with email, name, provider, avatar
- **Session**: NextAuth session management
- **Report**: Research report with markdown content and tags
- **Document**: Uploaded file with hash, storage path, and parsed content
- **ReportTag**: Tags for categorizing reports
- **DocumentTag**: Tags for categorizing documents

#### Key Relationships

```
User (1) -----> (*) Report
Report (1) ---> (*) Document
Report (1) ---> (*) ReportTag
Document (1) --> (*) DocumentTag
```

#### Deduplication Strategy

- Documents are identified by SHA-256 hash (`fileHash` column)
- Unique constraint on `(reportId, fileHash)` prevents duplicates within a report
- Same file content stored once, referenced multiple times

### Application Structure

```
app/
├── api/                          # Next.js API routes
│   ├── auth/[...nextauth]/      # NextAuth configuration
│   ├── reports/                 # Report CRUD endpoints
│   └── documents/               # Document CRUD endpoints
├── (auth)/                      # Auth pages (login, signup)
│   └── login/
└── (dashboard)/                 # Protected dashboard pages
    └── reports/

components/
├── reports/                     # Report management UI
├── documents/                   # Document viewing/editing UI
└── ui/                         # shadcn/ui components

domain/
├── entities/                    # Domain entities (Report, Document, User)
├── repositories/                # Repository interfaces
└── use-cases/                   # Application use cases

infrastructure/
└── repositories/                # Prisma repository implementations

lib/
├── db.ts                       # Prisma client singleton
└── auth.ts                     # NextAuth configuration

prisma/
├── schema.prisma               # Database schema
├── migrations/                 # Database migrations
└── seed.ts                     # Seed script with sample data
```

### Authentication

- **NextAuth** configuration at `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts`
- Supports:
  - Google OAuth
  - LinkedIn OAuth
  - Magic Link (passwordless email authentication via Resend)
- Session management via database sessions (Prisma adapter)
- User data stored in `users` and `sessions` tables
- See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#authentication-patterns) for authentication patterns

### Database (PostgreSQL + Prisma)

**Connection:**
- Development: Docker container on `localhost:54320`
- Configuration: `lib/db.ts` (Prisma client singleton)
- Connection string: `DATABASE_URL` environment variable

**Migrations:**
- Stored in `prisma/migrations/`
- Run with: `npx prisma migrate dev`
- Deploy with: `npx prisma migrate deploy`

**Schema:**
- Defined in `prisma/schema.prisma`
- Uses PostgreSQL-specific features (UUIDs, indexes)
- Soft deletes via `deletedAt` columns on Reports and Documents

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#database-query-patterns) for common database operations.**

### File Storage

- **Local filesystem** storage (not S3)
- Storage path: `./storage/` (configurable via `STORAGE_PATH` env var)
- Files organized by hash to prevent duplicates
- Path stored in `Document.storagePath`

### Document Parsing

- Files parsed using **LlamaCloud API** (optional)
- Configuration: `LLAMA_CLOUD_API_KEY` environment variable
- Parsing can be disabled if API key not provided
- Parsed content stored in `Document.parsedContent` (markdown format)

## Code Conventions

### Naming Conventions

- **Components**: `PascalCase` (e.g., `ReportCard`)
- **Component files**: `kebab-case` (e.g., `report-card.tsx`)
- **Utility files**: `kebab-case` (e.g., `format-date.ts`)
- **API routes**: `route.ts` in `kebab-case` directory
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Functions**: `camelCase`
- **Interfaces/Types**: `PascalCase` (suffix DTOs with `DTO`)
- **Database fields**: `camelCase` in Prisma schema

### TypeScript Conventions

- **Interfaces vs Types**: Use `interface` for object shapes, `type` for unions/intersections
- **DTOs**: Suffix with `DTO` (e.g., `CreateReportDTO`, `UpdateReportDTO`)
- **Avoid `any`**: Use `unknown` and narrow with type guards when type is truly unknown
- **Null handling**: Prefer explicit null checks over optional chaining where clarity matters
- **Generic naming**: Use descriptive names (e.g., `TReport` not `T`)
- **Type-only imports**: Use `import type` for types to improve build performance

### Import Order

Follow this structure for all files:

```typescript
// 1. React/Next.js framework imports
import { useState } from 'react';
import { redirect } from 'next/navigation';

// 2. Third-party libraries
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';

// 3. Absolute imports from project (@/*)
import { prisma } from '@/lib/db';
import { Report } from '@/domain/entities/Report';

// 4. Relative imports
import { ReportCard } from './report-card';

// 5. Type-only imports (at the end)
import type { NextAuthOptions } from 'next-auth';
```

**Note:** Not all imports currently use this pattern (known inconsistency to be fixed).

### React Component Conventions

- **Use Server Components by default** - Only add `'use client'` when needed (state, effects, browser APIs)
- **One component per file** - File name matches component name in kebab-case
- **Props interface naming**: `{ComponentName}Props`
  ```typescript
  interface ReportCardProps {
    report: Report;
    onDelete?: (id: string) => void;
  }

  export function ReportCard({ report, onDelete }: ReportCardProps) {
    // ...
  }
  ```
- **Component organization**:
  1. Imports
  2. Type definitions
  3. Component function
  4. Helper functions (below component)
- **Hooks**: Call at top of component, never conditionally

### API Response Format

**Success Response:**
```typescript
Response.json(data)                                 // Single resource
Response.json({ data, meta: { total, page } })      // Paginated lists
```

**Error Response:**
```typescript
Response.json({ error: 'User-friendly message' }, { status: code })
Response.json({ error: 'Message', details: validationErrors }, { status: 400 })
```

**Status Codes:**
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request (validation errors)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (authenticated but not authorized)
- 404: Not Found
- 500: Internal Server Error

### Error Handling

**API Routes:**
- Always use try-catch for async operations
- Return user-friendly error messages
- Log detailed errors to console
- Handle Prisma errors specifically (see [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#error-handling-patterns))

```typescript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ... operation
    return Response.json(data);
  } catch (error) {
    console.error('Operation failed:', error);
    return Response.json(
      { error: 'Failed to complete operation' },
      { status: 500 }
    );
  }
}
```

**Use Cases:**
- Let exceptions bubble up to API route layer
- Validate input before repository calls
- Throw business logic errors with descriptive messages

### Database Query Conventions

**Soft Deletes:**
- Always filter `deletedAt: null` for soft-deleted models (Report, Document)
```typescript
const reports = await prisma.report.findMany({
  where: {
    userId: user.id,
    deletedAt: null,  // Required for soft-deleted models
  },
});
```

**Transactions:**
- Use for operations that modify multiple tables
```typescript
await prisma.$transaction([
  prisma.report.update({ ... }),
  prisma.document.createMany({ ... }),
]);
```

**Unique Constraint Violations:**
- Handle `PrismaClientKnownRequestError` code P2002
- Provide user-friendly error messages

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#database-query-patterns) for detailed examples.**

### Code Style

- **Prettier**: 80 char line width, single quotes, trailing commas, Tailwind CSS class sorting
- **ESLint**: Next.js config with `@typescript-eslint/no-explicit-any` disabled
- **Pre-commit hooks**: Husky + lint-staged runs ESLint and Prettier on staged files

## Architecture Patterns

### Path Aliases

Use `@/*` to import from project root:

```typescript
import { Resource } from '@/types/types';
import { someUtil } from '@/lib/utils';
```

### Repository Pattern

All data access goes through repository interfaces:

```typescript
// domain/repositories/IReportRepository.ts
export interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  create(data: CreateReportDTO): Promise<Report>;
}
```

Implemented by Prisma repositories in `infrastructure/repositories/`.

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#repository-pattern) for detailed examples.**

### Use Case Pattern

Business logic encapsulated in use cases:

```typescript
// domain/use-cases/CreateReportUseCase.ts
export class CreateReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(data: CreateReportDTO): Promise<Report> {
    // Validate business rules
    // Delegate to repository
    return await this.reportRepository.create(data);
  }
}
```

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#use-case-pattern) for detailed examples.**

### API Route Pattern

API routes handle HTTP concerns and delegate to use cases:

```typescript
// app/api/reports/route.ts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id, deletedAt: null },
  });

  return Response.json(reports);
}
```

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#api-route-patterns) for detailed examples.**

## Testing

**📖 Guides**: [TDD-GUIDE.md](./docs/TDD-GUIDE.md) | [Behavior vs Implementation](./docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md)

**Commands**: `npm test` | `npm test:watch` | `npm test:coverage`

### Test Configuration

- **Jest** configured with `ts-jest` and `jsdom` environment
- Test files: `**/__tests__/**/*.test.ts(x)`
- Setup file: `jest.setup.js`
- Run single test: `npm test -- path/to/test.test.ts`

### Testing Patterns

**Use Case Tests:**
- Mock repository interfaces
- Test business logic in isolation
- Focus on behavior, not implementation

**API Route Tests:**
- Mock NextAuth session
- Test authentication and authorization
- Test error handling

**Component Tests:**
- Use React Testing Library
- Test user interactions
- Mock API calls

**See [CODE-PATTERNS.md](./docs/CODE-PATTERNS.md#testing-patterns) for detailed examples.**

## Development Workflow

### Initial Setup

```bash
# Install dependencies
npm install

# Setup local environment (starts DB, runs migrations, seeds data)
npm run local:setup

# Start development server
npm run dev
```

### Day-to-Day Development

```bash
# Start database (if not running)
npm run local:db:start

# Start dev server
npm run dev

# Run tests in watch mode
npm run test:watch

# View database in Prisma Studio
npx prisma studio
```

### Database Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_field

# 3. Prisma Client is auto-generated
# 4. Use in code immediately
```

### Resetting Database

```bash
# Reset and reseed (deletes all data!)
npm run local:db:reset
```

### Environment Variables

See `.env.local.example` for required and optional environment variables.

**Critical for development:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Application URL (http://localhost:3100 for local dev)

**Optional features:**
- Authentication providers (Google, LinkedIn) - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
- Document parsing (LlamaCloud API) - `LLAMA_CLOUD_API_KEY`
- Email (Resend for magic links) - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Analytics (PostHog) - `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- File storage - `STORAGE_PATH` (defaults to `./storage`)

## Known Issues

1. **TypeScript/ESLint in Builds**: Errors don't block builds (see `next.config.js`). Intentional for rapid iteration but should be fixed before production.

2. **Mobile Responsiveness**: Not implemented for devices smaller than laptop screens.

3. **File Parsing**: LlamaCloud parsing is optional. Can be disabled if API key not provided.

4. **Import Path Inconsistency**: Not all imports currently use `@/*` path aliases (gradual migration in progress).

## Additional Resources

- **[CODE-PATTERNS.md](./docs/CODE-PATTERNS.md)** - Detailed code examples and patterns
- **[Developer Guide](./docs/DEVELOPER-GUIDE.md)** - Complete implementation guide
- **[Database Schema](./docs/DATABASE-SCHEMA.md)** - Detailed schema documentation
- **[Database Quick Start](./docs/DATABASE-QUICKSTART.md)** - Database setup guide
- **[TDD Guide](./docs/TDD-GUIDE.md)** - Testing best practices
- **[TDD Behavior vs Implementation](./docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md)** - Testing philosophy
