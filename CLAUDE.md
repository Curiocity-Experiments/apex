# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Common Operations:**

```typescript
import { prisma } from '@/lib/db';

// Get all reports for a user
const reports = await prisma.report.findMany({
  where: {
    userId: user.id,
    deletedAt: null,
  },
  include: {
    reportTags: true,
    _count: { select: { documents: true } },
  },
  orderBy: { createdAt: 'desc' },
});
```

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

## Important Patterns

### Path Aliases

Use `@/*` to import from project root:

```typescript
import { Resource } from '@/types/types';
import { someUtil } from '@/lib/utils';
```

**Note:** Not all imports currently use this pattern (known inconsistency).

### API Route Pattern

```typescript
// app/api/reports/route.ts
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
  });

  return Response.json(reports);
}
```

### Repository Pattern

```typescript
// domain/repositories/IReportRepository.ts
export interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  create(data: CreateReportDTO): Promise<Report>;
}

// infrastructure/repositories/PrismaReportRepository.ts
export class PrismaReportRepository implements IReportRepository {
  async findById(id: string): Promise<Report | null> {
    return await prisma.report.findUnique({ where: { id } });
  }
}
```

### Use Case Pattern

```typescript
// domain/use-cases/CreateReportUseCase.ts
export class CreateReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(data: CreateReportDTO): Promise<Report> {
    return await this.reportRepository.create(data);
  }
}
```

## Known Issues

1. **TypeScript/ESLint in Builds**: Errors don't block builds (see `next.config.js`). Intentional for rapid iteration but should be fixed before production.

2. **Mobile Responsiveness**: Not implemented for devices smaller than laptop screens.

3. **File Parsing**: LlamaCloud parsing is optional. Can be disabled if API key not provided.

## Environment Variables

Required variables for local development (see `.env.local.example`):

```bash
# Database
DATABASE_URL=postgresql://postgres:devpassword@localhost:54320/apex_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3100
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Optional: LinkedIn OAuth
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Optional: Email (Magic Links)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Optional: Document Parsing
LLAMA_CLOUD_API_KEY=llx-...

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# File Storage
STORAGE_PATH=./storage
```

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
```typescript
import { CreateReportUseCase } from '@/domain/use-cases/CreateReportUseCase';

describe('CreateReportUseCase', () => {
  it('creates report with valid data', async () => {
    const mockRepo = /* mock repository */;
    const useCase = new CreateReportUseCase(mockRepo);

    const result = await useCase.execute({
      userId: 'user-123',
      name: 'Q4 Analysis',
      content: '# Content',
    });

    expect(result.name).toBe('Q4 Analysis');
  });
});
```

**API Route Tests:**
```typescript
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/reports/route';

describe('GET /api/reports', () => {
  it('returns reports for authenticated user', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeInstanceOf(Array);
  });
});
```

## Code Style

- **Prettier**: 80 char line width, single quotes, trailing commas, Tailwind CSS class sorting
- **ESLint**: Next.js config with `@typescript-eslint/no-explicit-any` disabled
- **Pre-commit hooks**: Husky + lint-staged runs ESLint and Prettier on staged files

## Local Development Workflow

### Initial Setup

```bash
# 1. Clone and install
git clone https://github.com/Curiocity-Experiments/apex.git
cd apex
npm install

# 2. Setup local environment (one command)
npm run local:setup

# 3. Start development server
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

## Additional Resources

- **[Developer Guide](./docs/DEVELOPER-GUIDE.md)** - Complete implementation guide
- **[Database Schema](./docs/DATABASE-SCHEMA.md)** - Detailed schema documentation
- **[Database Quick Start](./docs/DATABASE-QUICKSTART.md)** - Database setup guide
- **[TDD Guide](./docs/TDD-GUIDE.md)** - Testing best practices
