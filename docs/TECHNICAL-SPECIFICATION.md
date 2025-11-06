# Apex Technical Specification

**Version**: 1.0
**Date**: 2025-11-06
**Status**: Ready for Implementation
**Phase**: NOW (Core MVP - Local Development)

---

## Executive Summary

This technical specification defines the complete architecture and implementation details for **Apex**, a research document management platform for financial analysts.

**Architecture Overview**: Apex follows **clean architecture principles** with clear separation of concerns, dependency inversion, and a layered approach that ensures maintainability, testability, and scalability.

---

## Document Structure

This technical specification is organized across multiple focused documents:

### 📐 **1. Architecture & System Design**

**File**: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)

**What's Inside**:

- System architecture diagram (5-layer clean architecture)
- Layered architecture description
- Data flow diagrams (upload, auth, search)
- Component architecture overview
- Migration-ready design (NOW → NEXT → LATER)
- Clear separation of concerns with dependency inversion

---

### 🗄️ **2. Database Schema**

**Files**:

- [`docs/DATABASE-SCHEMA.md`](./DATABASE-SCHEMA.md) (Complete specification)
- [`docs/DATABASE-QUICKSTART.md`](./DATABASE-QUICKSTART.md) (Setup guide)

**What's Inside**:

- Entity-relationship diagram
- Complete PostgreSQL DDL (6 tables)
- Prisma schema (ORM configuration)
- Indexes for performance
- Sample data with seed scripts
- Migration strategy (NOW → NEXT)
- Repository pattern for clean data access abstraction

---

### 🔌 **3. API Design**

**File**: [`docs/specs/API-DESIGN.md`](./specs/API-DESIGN.md)

**What's Inside**:

- Authentication flows (Google, LinkedIn, Magic Link)
- 30+ RESTful API endpoints
- Request/response examples for every endpoint
- File upload flow (18 detailed steps)
- Error handling with status codes
- Complete code examples
- Structured API client with type safety

---

### 🧩 **4. Component Structure & File Organization**

**File**: [`docs/technical-spec/component-structure.md`](./technical-spec/component-structure.md)

**What's Inside**:

- Complete file/folder structure
- Component hierarchy diagram
- Service layer design (business logic)
- Repository layer design (database access)
- State management strategy (React Query + Zustand)
- Custom hooks pattern
- Complete component examples
- Clear separation between presentation and business logic

---

## Quick Reference

### Tech Stack (NOW Phase)

| Layer         | Technology              | Purpose                   |
| ------------- | ----------------------- | ------------------------- |
| **Frontend**  | Next.js 14 (App Router) | React framework           |
| **UI**        | React 18, TypeScript    | Component library         |
| **Styling**   | Tailwind CSS            | Utility-first CSS         |
| **Editor**    | React SimpleMDE         | Markdown editor           |
| **Database**  | PostgreSQL 16 (Docker)  | Relational database       |
| **ORM**       | Prisma                  | Type-safe database client |
| **Auth**      | NextAuth                | Authentication            |
| **Storage**   | Local filesystem        | File storage              |
| **Parsing**   | LlamaParse API          | Document text extraction  |
| **Analytics** | PostHog                 | Usage tracking            |
| **Email**     | Resend                  | Magic link emails         |

---

### Architecture Layers

```
┌─────────────────────────────────────┐
│   Presentation Layer (React)        │  ← Components, Pages, UI State
├─────────────────────────────────────┤
│   Application Layer (Services)      │  ← Business Logic (NEW!)
├─────────────────────────────────────┤
│   Domain Layer (Entities)           │  ← Validation, Rules (NEW!)
├─────────────────────────────────────┤
│   Infrastructure Layer (Repos)      │  ← Database Access (NEW!)
├─────────────────────────────────────┤
│   External Services                 │  ← LlamaParse, NextAuth, PostHog
└─────────────────────────────────────┘
```

**Dependency Rule**: Outer layers depend on inner layers, never the reverse.

---

### Core Entities

```typescript
// Domain Layer - Business Entities

interface User {
  id: string; // UUID
  email: string; // Unique
  name: string;
  createdAt: Date;
}

interface Report {
  id: string; // UUID
  userId: string; // FK → User
  name: string;
  content: string; // Markdown (NOW), Tiptap JSON (NEXT)
  tags: string[]; // Report-level tags
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: string; // UUID
  reportId: string; // FK → Report
  filename: string;
  fileHash: string; // SHA-256 for duplicate detection
  storagePath: string; // Local path (NOW), Supabase URL (NEXT)
  parsedContent: string; // LlamaParse markdown output
  notes: string; // User notes about document
  tags: string[]; // Document-level tags
  createdAt: Date;
}
```

---

### Service Layer (Business Logic)

```typescript
// Services handle all business logic

class ReportService {
  constructor(
    private reportRepo: IReportRepository,
    private analytics: IAnalytics,
  ) {}

  async createReport(userId: string, name: string): Promise<Report> {
    // Validation
    if (!name.trim()) throw new ValidationError('Name required');

    // Business logic
    const report = Report.create({ userId, name });

    // Persistence
    await this.reportRepo.save(report);

    // Analytics
    this.analytics.track('report_created', { reportId: report.id });

    return report;
  }
}

class DocumentService {
  constructor(
    private documentRepo: IDocumentRepository,
    private storageService: IStorageService,
    private parserService: IParserService,
  ) {}

  async uploadDocument(reportId: string, file: File): Promise<Document> {
    // 1. Validate file
    this.validateFile(file);

    // 2. Calculate hash (duplicate detection)
    const fileHash = await this.calculateHash(file);

    // 3. Check for duplicates in this report
    const existing = await this.documentRepo.findByHash(reportId, fileHash);
    if (existing) {
      throw new DuplicateError('Document already exists in this report');
    }

    // 4. Store file
    const storagePath = await this.storageService.save(file);

    // 5. Parse content (async, non-blocking)
    const parsedContent = await this.parserService.parse(file);

    // 6. Create document record
    const document = Document.create({
      reportId,
      filename: file.name,
      fileHash,
      storagePath,
      parsedContent,
    });

    await this.documentRepo.save(document);

    return document;
  }
}
```

---

### Repository Layer (Database Access)

```typescript
// Repositories encapsulate all database operations

interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  save(report: Report): Promise<void>;
  delete(id: string): Promise<void>;
}

class PostgresReportRepository implements IReportRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Report | null> {
    const row = await this.prisma.report.findUnique({
      where: { id },
      include: { documents: true, tags: true },
    });

    return row ? this.toDomain(row) : null;
  }

  async save(report: Report): Promise<void> {
    await this.prisma.report.upsert({
      where: { id: report.id },
      create: this.toDatabase(report),
      update: this.toDatabase(report),
    });
  }

  private toDomain(row: any): Report {
    // Map database row to domain entity
  }

  private toDatabase(report: Report): any {
    // Map domain entity to database row
  }
}
```

---

### Custom Hooks (UI → Service Bridge)

```typescript
// Hooks connect React components to services

function useReports() {
  const reportService = useService(ReportService);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.listReports()
  });

  const createReport = useMutation({
    mutationFn: (name: string) => reportService.createReport(name),
    onSuccess: () => queryClient.invalidateQueries(['reports'])
  });

  return { reports, isLoading, createReport };
}

// Usage in component
function ReportList() {
  const { reports, createReport } = useReports();

  return (
    <div>
      {reports.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
      <button onClick={() => createReport.mutate('New Report')}>
        Create Report
      </button>
    </div>
  );
}
```

---

## File Structure Overview

```
apex/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth pages (login, signup)
│   ├── (app)/                     # Main app (requires auth)
│   │   ├── reports/               # Report list & editor
│   │   └── layout.tsx             # App layout
│   ├── api/                       # API routes
│   │   ├── auth/[...nextauth]/    # NextAuth
│   │   ├── reports/               # Report CRUD
│   │   ├── documents/             # Document upload/manage
│   │   └── search/                # Search endpoint
│   └── layout.tsx                 # Root layout
│
├── components/                    # React components (UI only)
│   ├── reports/                   # Report UI components
│   ├── documents/                 # Document UI components
│   ├── editor/                    # Markdown editor
│   └── shared/                    # Shared components
│
├── services/                      # Business logic (NEW!)
│   ├── ReportService.ts
│   ├── DocumentService.ts
│   ├── FileStorageService.ts
│   └── ParserService.ts
│
├── repositories/                  # Database access (NEW!)
│   ├── interfaces/                # Repository interfaces
│   ├── ReportRepository.ts
│   └── DocumentRepository.ts
│
├── domain/                        # Business entities (NEW!)
│   ├── entities/
│   │   ├── Report.ts
│   │   ├── Document.ts
│   │   └── User.ts
│   └── errors/                    # Domain errors
│
├── lib/                           # Utilities
│   ├── db.ts                      # Prisma client
│   ├── auth.ts                    # NextAuth config
│   ├── validation.ts              # Zod schemas
│   └── di.ts                      # Dependency injection (NEW!)
│
├── hooks/                         # Custom React hooks
│   ├── useReports.ts
│   ├── useDocuments.ts
│   └── useAuth.ts
│
├── stores/                        # Zustand stores (UI state)
│   ├── editorStore.ts
│   └── uiStore.ts
│
├── types/                         # TypeScript types
│   ├── api.ts                     # API types
│   └── database.ts                # Prisma types
│
└── prisma/
    ├── schema.prisma              # Database schema
    └── seed.ts                    # Sample data
```

---

## Development Workflow

### 1. **Setup Local Environment**

```bash
# Clone repository
git clone <repository-url>
cd apex

# Install dependencies
npm install

# Start PostgreSQL
docker run -d --name apex-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=apex_dev \
  postgres:16-alpine

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed

# Start dev server
npm run dev
```

### 2. **Feature Development Pattern**

```
1. Define entity in domain/ (if new)
2. Create repository interface in repositories/interfaces/
3. Implement repository in repositories/
4. Create service in services/
5. Write tests for service
6. Create custom hook in hooks/
7. Build React components in components/
8. Create page in app/
9. Add API route in app/api/ (if needed)
10. Test end-to-end
```

### 3. **Testing Strategy**

```
Unit Tests (Jest)
├── Domain entities (validation, business rules)
├── Services (business logic with mocked repos)
├── Repositories (with test database)
└── Utilities

Integration Tests (Playwright)
├── API endpoints
├── Authentication flows
└── File upload

E2E Tests (Playwright)
├── Create report
├── Upload document
└── Search workflow
```

---

## Migration Path (NOW → NEXT → LATER)

### NOW Phase (Current)

- **Database**: PostgreSQL (Docker local)
- **Storage**: Local filesystem
- **Search**: PostgreSQL ILIKE (filename only)
- **Editor**: SimpleMDE (markdown)
- **Deployment**: Local development

### NEXT Phase (Cloud)

- **Database**: Supabase PostgreSQL (connection string change only)
- **Storage**: Supabase Storage (swap FileStorageService implementation)
- **Search**: PostgreSQL full-text (tsvector columns, GIN indexes)
- **Editor**: Tiptap (WYSIWYG, content migrated from markdown)
- **Deployment**: Vercel

**Code Changes**: Minimal (swap infrastructure implementations, UI unchanged)

### LATER Phase (Collaboration)

- **Real-Time**: Yjs + WebSocket server
- **Search**: Typesense (advanced search with fuzzy matching)
- **Mobile**: PWA (responsive design)
- **Transcription**: OpenAI Whisper (audio/video)

---

## Key Architectural Decisions

### ✅ Clean Architecture Benefits

1. **Separation of Concerns**: Each layer has one job
2. **Dependency Inversion**: Depend on interfaces, not implementations
3. **Testability**: Mock any layer (repos, services, APIs)
4. **Maintainability**: Changes isolated to single layer
5. **Scalability**: Swap implementations (PostgreSQL → Supabase, local → cloud)
6. **Type Safety**: TypeScript throughout with full type inference
7. **Performance**: Optimistic updates, caching, and connection pooling built-in
8. **Developer Experience**: Clear patterns and conventions for rapid development

---

## Environment Variables

See each specification document for complete lists:

- Architecture: NextAuth, OAuth providers
- Database: PostgreSQL connection string
- API: LlamaParse, Resend, PostHog keys
- Storage: Local path (NOW), Supabase (NEXT)

**Example `.env.local`**:

```bash
# Database
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/apex_dev

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl>

# OAuth
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
LINKEDIN_CLIENT_ID=<from-linkedin-developers>
LINKEDIN_CLIENT_SECRET=<from-linkedin-developers>

# Email (Magic Links)
RESEND_API_KEY=<from-resend.com>

# Parsing
LLAMA_CLOUD_API_KEY=<from-cloud.llamaindex.ai>

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=<from-posthog.com>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Storage
STORAGE_PATH=./storage
```

---

## Security Considerations

1. **Authentication**: NextAuth JWT with 30-day expiration
2. **Authorization**: User can only access their own reports/documents
3. **Input Validation**: Zod schemas in API routes + domain entities
4. **File Upload**: Type/size validation, path sanitization
5. **SQL Injection**: Prevented by Prisma (parameterized queries)
6. **XSS**: React auto-escapes, DOMPurify for markdown rendering
7. **CSRF**: NextAuth handles CSRF tokens
8. **Secrets**: Environment variables, never committed

---

## Performance Optimization

### Database

- Indexes on all foreign keys
- Composite indexes (user_id + created_at)
- Partial indexes (WHERE deleted_at IS NULL)
- Connection pooling (Prisma default: 10 connections)

### Frontend

- Code splitting (Next.js automatic)
- Lazy loading (React.lazy for heavy components)
- Debounced search (300ms)
- Virtualized lists (react-window for 100+ items)

### File Handling

- Async parsing (non-blocking uploads)
- Streaming uploads (multipart)
- SHA-256 hashing (Web Crypto API, parallelized)

---

## Testing & Quality Assurance

### Testing Methodology: Strict TDD

**Apex follows Test-Driven Development (TDD)** - All code written test-first using Red-Green-Refactor cycle.

**Why TDD for Apex:**

- Financial data platform requires high correctness
- Tests drive clean architecture and design
- 90%+ code coverage naturally achieved
- Refactoring safety from day 1
- Living documentation through tests

**Reference**: See [`docs/TDD-GUIDE.md`](./TDD-GUIDE.md) for comprehensive TDD practices.

---

### Test Pyramid

```
           /\
          /E2E\       ← Few (5-10 critical user flows)
         /------\      - Full authentication → report → document flow
        /  API   \     - Slow but high confidence
       /----------\
      / Component  \   ← Some (30-40 API endpoints)
     /  Integration \   - Test all HTTP endpoints
    /--------------\   - Auth, validation, error handling
   /                \
  /   Component      \ ← More (50-60 React components)
 /     Tests          \ - User interactions
/--------------------\  - Loading/error states
                        - React Testing Library

    Unit Tests          ← Many (100+ units)
   --------------       - Domain entities
  Foundation Layer      - Services (mocked repos)
                        - Repositories (mocked Prisma)
                        - Pure functions
                        - Fast, isolated
```

**Principle**: More unit tests (fast), fewer integration tests (slower), minimal E2E tests (slowest).

---

### Testing Strategy by Layer

| Layer               | Test Type          | Tools            | Coverage Target     | Approach                    |
| ------------------- | ------------------ | ---------------- | ------------------- | --------------------------- |
| **Domain Entities** | Unit               | Jest             | 100%                | Pure functions, no mocking  |
| **Services**        | Unit               | Jest + Mocks     | 95%                 | Mock repositories           |
| **Repositories**    | Unit + Integration | Jest + Prisma    | 90%                 | Mock Prisma + real DB tests |
| **API Routes**      | Integration        | Jest + Supertest | 90%                 | Test HTTP endpoints         |
| **React Hooks**     | Unit               | Jest + RTL       | 85%                 | Mock fetch, test state      |
| **Components**      | Unit               | Jest + RTL       | 80%                 | User-centric testing        |
| **Pages**           | Integration + E2E  | Playwright       | Critical paths only | Full user flows             |

---

### TDD Workflow (Red-Green-Refactor)

**Every feature follows this cycle:**

```typescript
// 1. 🔴 RED - Write failing test
describe('ReportService', () => {
  it('should create report with valid name', async () => {
    const report = await service.createReport('user-123', 'Q4 Report');
    expect(report.name).toBe('Q4 Report');
  });
});
// Run: npm test → ❌ Fails (method doesn't exist)

// 2. 🟢 GREEN - Write minimal code to pass
class ReportService {
  async createReport(userId: string, name: string): Promise<Report> {
    return ReportEntity.create({ userId, name });
  }
}
// Run: npm test → ✅ Passes

// 3. 🔵 REFACTOR - Clean up while keeping tests green
class ReportService {
  async createReport(userId: string, name: string): Promise<Report> {
    const report = ReportEntity.create({ userId, name: name.trim() });
    await this.reportRepository.save(report);
    return report;
  }
}
// Run: npm test → ✅ Still passes

// 4. ✅ COMMIT - Test + implementation together
```

---

### Test Organization

```
apex/
├── domain/
│   ├── entities/
│   │   ├── Report.ts
│   │   └── __tests__/
│   │       └── Report.test.ts          # Unit tests (100% coverage)
│
├── services/
│   ├── ReportService.ts
│   └── __tests__/
│       └── ReportService.test.ts       # Unit tests (mock repos)
│
├── repositories/
│   ├── implementations/
│   │   ├── PrismaReportRepository.ts
│   │   └── __tests__/
│   │       ├── PrismaReportRepository.test.ts           # Unit (mocked)
│   │       └── PrismaReportRepository.integration.test.ts  # Real DB
│
├── app/
│   └── api/
│       └── reports/
│           ├── route.ts
│           └── __tests__/
│               └── route.test.ts       # Integration tests
│
├── components/
│   └── reports/
│       ├── ReportList.tsx
│       └── __tests__/
│           └── ReportList.test.tsx     # Component tests (RTL)
│
└── __tests__/
    ├── utils/
    │   ├── mocks.ts                    # Common mocks
    │   ├── factories.ts                # Test data factories
    │   └── testHelpers.ts              # Test utilities
    ├── setup.ts                        # Jest setup
    └── e2e/
        └── reportFlow.test.ts          # E2E tests (Playwright)
```

---

### Test Coverage Goals

| Metric                        | Target | Enforcement      |
| ----------------------------- | ------ | ---------------- |
| **Overall Line Coverage**     | 90%    | CI blocks < 90%  |
| **Overall Branch Coverage**   | 85%    | CI blocks < 85%  |
| **Overall Function Coverage** | 90%    | CI blocks < 90%  |
| **Domain Entities**           | 100%   | CI blocks < 100% |
| **Services**                  | 95%    | CI blocks < 95%  |
| **Repositories**              | 90%    | CI blocks < 90%  |
| **API Routes**                | 90%    | CI blocks < 90%  |
| **Components**                | 80%    | CI blocks < 80%  |

**Coverage Reports**:

```bash
npm test -- --coverage              # Generate coverage report
open coverage/lcov-report/index.html  # View in browser
```

---

### CI/CD Integration

**Pre-commit Hook** (via Husky):

```bash
# .husky/pre-commit
npm test -- --bail --findRelatedTests  # Run tests for changed files
```

**GitHub Actions** (on PR):

```yaml
- name: Run tests
  run: npm test -- --coverage

- name: Check coverage thresholds
  run: npm test -- --coverage --coverageThreshold='{"global":{"lines":90}}'

- name: Upload to Codecov
  uses: codecov/codecov-action@v3
```

**Merge Requirements**:

- ✅ All tests passing
- ✅ Coverage targets met
- ✅ No ESLint errors
- ✅ Code formatted (Prettier)

---

### Testing Tools & Dependencies

```json
{
  "devDependencies": {
    // Core Testing
    "jest": "^29.7.0",
    "@jest/globals": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",

    // React Testing
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/user-event": "^14.5.1",

    // API Testing
    "supertest": "^6.3.3",
    "node-mocks-http": "^1.13.0",

    // Mocking
    "jest-mock-extended": "^3.0.5",
    "msw": "^2.0.0",

    // E2E Testing
    "@playwright/test": "^1.40.0"
  }
}
```

---

### Code Quality Tools

**ESLint** (strict TypeScript rules):

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Prettier** (code formatting):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**TypeScript** (strict mode):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

**Husky + lint-staged** (pre-commit hooks):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "jest --bail --findRelatedTests"],
    "*.{ts,tsx,css,md,json}": "prettier --write"
  }
}
```

---

### Quality Metrics

**Test Metrics**:

- Total tests: 100+
- Unit test execution: < 30 seconds
- Integration test execution: < 2 minutes
- E2E test execution: < 5 minutes
- Test flakiness: < 1%

**Code Quality Metrics**:

- TypeScript strict mode: ✅ Enabled
- ESLint errors: 0
- Code coverage: 90%+
- Cyclomatic complexity: < 10 per function
- File size: < 300 lines per file

**Bug Metrics** (track after launch):

- Production bugs: < 5% escape rate
- Time to fix critical: < 1 hour
- Time to fix major: < 1 day
- Regression rate: < 2%

---

## Deployment Checklist (NOW Phase)

- [ ] PostgreSQL running (Docker)
- [ ] Environment variables configured
- [ ] Prisma migrations applied
- [ ] Database seeded
- [ ] OAuth apps created (Google, LinkedIn)
- [ ] Resend API key obtained
- [ ] LlamaParse API key obtained
- [ ] Dev server starts (`npm run dev`)
- [ ] Can create account (magic link email works)
- [ ] Can create report
- [ ] Can upload document (TXT/MD)
- [ ] Document parsed by LlamaParse
- [ ] Search by filename works
- [ ] Tags work (report + document level)

---

## Next Steps

1. ✅ **PRDs Created** (NOW, NEXT, LATER)
2. ✅ **Technical Decisions Made** (all 15 decisions)
3. ✅ **Technical Specification Complete** (this document)
4. 🔄 **Developer Implementation Guide** (next)
   - Step-by-step coding instructions
   - Component-by-component build order
   - Testing as you go
   - Deployment instructions

---

## Document Index

| Document                | Purpose                           | Location                                                                                |
| ----------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **Architecture**        | System design, layers, data flow  | [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)                                             |
| **Database Schema**     | Tables, indexes, Prisma           | [`docs/DATABASE-SCHEMA.md`](./DATABASE-SCHEMA.md)                                       |
| **Database Quickstart** | Setup guide                       | [`docs/DATABASE-QUICKSTART.md`](./DATABASE-QUICKSTART.md)                               |
| **API Design**          | Endpoints, auth, file upload      | [`docs/specs/API-DESIGN.md`](./specs/API-DESIGN.md)                                     |
| **Component Structure** | React components, hooks, services | [`docs/technical-spec/component-structure.md`](./technical-spec/component-structure.md) |
| **PRD-NOW**             | MVP requirements                  | [`docs/prd/PRD-NOW-Core-MVP.md`](./prd/PRD-NOW-Core-MVP.md)                             |
| **PRD-NEXT**            | Cloud enhancements                | [`docs/prd/PRD-NEXT-Enhanced-Features.md`](./prd/PRD-NEXT-Enhanced-Features.md)         |
| **PRD-LATER**           | Collaboration features            | [`docs/prd/PRD-LATER-Advanced-Features.md`](./prd/PRD-LATER-Advanced-Features.md)       |
| **Technical Decisions** | Technology choices                | [`docs/prd/TECHNICAL-DECISIONS.md`](./prd/TECHNICAL-DECISIONS.md)                       |

---

**Status**: ✅ Ready for implementation
**Approval**: Pending review
**Next Deliverable**: Developer Implementation Guide

---

**END OF TECHNICAL SPECIFICATION**
