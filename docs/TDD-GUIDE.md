# Apex Test-Driven Development (TDD) Guide

**Version**: 1.0
**Date**: 2025-11-06
**Status**: Active Development Practice
**Applies To**: All Apex development phases

---

## Table of Contents

1. [TDD Philosophy](#1-tdd-philosophy)
2. [The Red-Green-Refactor Cycle](#2-the-red-green-refactor-cycle)
3. [Testing Strategy by Layer](#3-testing-strategy-by-layer)
4. [Test Organization](#4-test-organization)
5. [Test Patterns & Utilities](#5-test-patterns--utilities)
6. [TDD Workflow Examples](#6-tdd-workflow-examples)
7. [Common Testing Scenarios](#7-common-testing-scenarios)
8. [CI/CD Integration](#8-cicd-integration)
9. [Coverage Goals & Metrics](#9-coverage-goals--metrics)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. TDD Philosophy

### Why Test-Driven Development?

**Test-Driven Development is NOT about testing. It's about design.**

TDD is a development methodology where:

1. **Tests drive design** - Not validate it after the fact
2. **Red-Green-Refactor** - Write failing test → Make it pass → Clean up
3. **Tests first, always** - No production code without a failing test

### Benefits for Apex

**🏗️ Better Architecture**

- Forces clean separation of concerns
- Naturally enforces SOLID principles
- Dependencies are explicit (easy to mock)
- Tight coupling becomes immediately obvious

**🐛 Bug Prevention**

- Catch issues at write-time, not runtime
- Tests document expected behavior
- Regression protection built-in
- 80% fewer production bugs (industry data)

**🚀 Refactoring Confidence**

- Make changes fearlessly
- Tests verify behavior unchanged
- Performance optimization without breaking features
- Technical debt reduction becomes safe

**📚 Living Documentation**

- Tests show how code should be used
- Examples for every feature
- Always up-to-date (or tests fail)
- Onboarding new developers faster

**💰 Cost-Benefit for Financial Platform**

- Financial data requires high correctness
- User trust depends on reliability
- Test-first costs 30% more time upfront
- Saves 70% debugging time later
- **ROI: 3x faster feature velocity after initial build**

---

## 2. The Red-Green-Refactor Cycle

### The Three Phases

```
┌─────────────┐
│   🔴 RED    │  Write a failing test
│             │  (Test what you want to build)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  🟢 GREEN   │  Write minimal code to pass
│             │  (Make the test pass)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 🔵 REFACTOR │  Clean up code
│             │  (Improve while keeping tests green)
└──────┬──────┘
       │
       └──────────┐
                  │
         (Repeat for next feature)
```

### Phase 1: 🔴 RED (Write Failing Test)

**Goal**: Define what you want to build through a test

```typescript
// Example: domain/entities/__tests__/Report.test.ts
import { ReportEntity } from '../Report';

describe('ReportEntity', () => {
  describe('create', () => {
    it('should create a report with valid name', () => {
      const report = ReportEntity.create({
        userId: 'user-123',
        name: 'Q4 Earnings Report',
      });

      expect(report.name).toBe('Q4 Earnings Report');
      expect(report.userId).toBe('user-123');
      expect(report.content).toBe('');
      expect(report.id).toBeDefined();
    });
  });
});
```

**Run the test:**

```bash
npm test -- Report.test.ts
```

**Expected result:** ❌ Test fails (Report.ts doesn't exist yet)

**✅ Good RED phase:**

- Test describes desired behavior clearly
- Test is focused on one thing
- Test would pass if implementation existed

**❌ Bad RED phase:**

- Test is vague or unclear
- Test tests multiple things
- Test has syntax errors (should compile)

### Phase 2: 🟢 GREEN (Make Test Pass)

**Goal**: Write the simplest code that makes the test pass

```typescript
// domain/entities/Report.ts
import { z } from 'zod';

export const ReportSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type Report = z.infer<typeof ReportSchema>;

export class ReportEntity {
  static create(params: { userId: string; name: string }): Report {
    return {
      id: crypto.randomUUID(),
      userId: params.userId,
      name: params.name,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }
}
```

**Run the test:**

```bash
npm test -- Report.test.ts
```

**Expected result:** ✅ Test passes

**✅ Good GREEN phase:**

- Minimal code to pass test (no gold-plating)
- Test passes immediately
- Code compiles without errors

**❌ Bad GREEN phase:**

- Adding features not tested
- Premature optimization
- Test still failing

### Phase 3: 🔵 REFACTOR (Clean Up)

**Goal**: Improve code quality while keeping tests green

```typescript
// Refactored version
export class ReportEntity {
  constructor(private data: Report) {}

  static create(params: { userId: string; name: string }): Report {
    this.validateName(params.name);

    return {
      id: crypto.randomUUID(),
      userId: params.userId,
      name: params.name.trim(), // Trim whitespace
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  }

  private static validateName(name: string): void {
    if (!name || !name.trim()) {
      throw new Error('Report name cannot be empty');
    }
    if (name.length > 200) {
      throw new Error('Report name too long (max 200 characters)');
    }
  }

  get name() {
    return this.data.name;
  }

  updateName(name: string): void {
    ReportEntity.validateName(name);
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  toJSON(): Report {
    return { ...this.data };
  }
}
```

**Run the test:**

```bash
npm test -- Report.test.ts
```

**Expected result:** ✅ Test still passes (behavior unchanged)

**✅ Good REFACTOR phase:**

- Tests still pass
- Code more readable
- Duplication removed
- Better names

**❌ Bad REFACTOR phase:**

- Tests break (changed behavior)
- Made code more complex
- Added untested features

### TDD Rules (The Three Laws)

**Law 1:** You are not allowed to write production code unless it makes a failing test pass.

**Law 2:** You are not allowed to write more of a test than is sufficient to fail (compilation failures count).

**Law 3:** You are not allowed to write more production code than is sufficient to pass the failing test.

---

## 3. Testing Strategy by Layer

### Test Pyramid for Apex

```
           /\
          /  \        E2E Tests (5-10)
         /    \       - Full user journeys
        /------\      - Slow, expensive
       /        \     - Critical paths only
      /   API    \
     /   Tests    \   API Integration (30-40)
    /  (30-40)    \  - Test HTTP endpoints
   /--------------\  - Auth, validation, DB
  /                \
 /    Component     \ Component Tests (50-60)
/   Tests (50-60)   \- React Testing Library
--------------------  - User interactions
                      - Loading/error states

     Unit Tests       Unit Tests (100+)
    (100+ tests)      - Domain entities
    --------------    - Services (mocked deps)
  Foundation Layer    - Pure functions
                      - Fast, isolated
```

**Key Principles:**

- More unit tests (fast, isolated)
- Fewer integration tests (slower, more setup)
- Minimal E2E tests (slowest, most brittle)

---

### Domain Layer (Pure Functions - 100% Coverage)

**What to Test:**

- Entity creation
- Validation logic
- Business rules
- State transitions
- Edge cases

**What NOT to Test:**

- Database interactions (no DB in domain)
- API calls (no I/O in domain)
- UI rendering (domain is UI-agnostic)

**Example: Report Entity**

```typescript
// domain/entities/__tests__/Report.test.ts
import { ReportEntity } from '../Report';

describe('ReportEntity', () => {
  describe('create', () => {
    it('should create report with valid data', () => {
      const report = ReportEntity.create({
        userId: 'user-123',
        name: 'My Report',
      });

      expect(report.id).toBeDefined();
      expect(report.name).toBe('My Report');
      expect(report.userId).toBe('user-123');
      expect(report.content).toBe('');
      expect(report.deletedAt).toBeNull();
    });

    it('should trim report name', () => {
      const report = ReportEntity.create({
        userId: 'user-123',
        name: '  My Report  ',
      });

      expect(report.name).toBe('My Report');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        ReportEntity.create({ userId: 'user-123', name: '' });
      }).toThrow('Report name cannot be empty');
    });

    it('should throw error for name > 200 chars', () => {
      const longName = 'a'.repeat(201);

      expect(() => {
        ReportEntity.create({ userId: 'user-123', name: longName });
      }).toThrow('Report name too long');
    });
  });

  describe('updateName', () => {
    it('should update name and updatedAt timestamp', () => {
      const report = ReportEntity.create({
        userId: 'user-123',
        name: 'Original Name',
      });
      const originalUpdatedAt = report.updatedAt;

      // Wait 10ms to ensure timestamp changes
      setTimeout(() => {
        const entity = new ReportEntity(report);
        entity.updateName('New Name');
        const updated = entity.toJSON();

        expect(updated.name).toBe('New Name');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 10);
    });

    it('should throw error for invalid name', () => {
      const report = ReportEntity.create({
        userId: 'user-123',
        name: 'Original Name',
      });
      const entity = new ReportEntity(report);

      expect(() => {
        entity.updateName('');
      }).toThrow('Report name cannot be empty');
    });
  });
});
```

**Key Points:**

- ✅ No mocking needed (pure functions)
- ✅ Fast execution (no I/O)
- ✅ 100% branch coverage achievable
- ✅ Tests document validation rules

---

### Repository Layer (Database I/O - 90% Coverage)

**What to Test:**

- CRUD operations
- Query filtering
- Error handling
- Transaction behavior

**Approach: Two types of tests**

**1. Unit Tests (with mocked Prisma)**

```typescript
// repositories/implementations/__tests__/PrismaReportRepository.test.ts
import { PrismaReportRepository } from '../PrismaReportRepository';
import { prismaMock } from '@/__tests__/utils/prismaMock';

jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

describe('PrismaReportRepository', () => {
  let repository: PrismaReportRepository;

  beforeEach(() => {
    repository = new PrismaReportRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return report when found', async () => {
      const mockReport = {
        id: 'report-123',
        userId: 'user-123',
        name: 'Test Report',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaMock.report.findUnique.mockResolvedValue(mockReport);

      const result = await repository.findById('report-123');

      expect(result).toEqual(mockReport);
      expect(prismaMock.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123', deletedAt: null },
      });
    });

    it('should return null when not found', async () => {
      prismaMock.report.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create new report', async () => {
      const report = {
        id: 'report-123',
        userId: 'user-123',
        name: 'New Report',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaMock.report.upsert.mockResolvedValue(report);

      await repository.save(report);

      expect(prismaMock.report.upsert).toHaveBeenCalledWith({
        where: { id: report.id },
        create: expect.objectContaining({ name: 'New Report' }),
        update: expect.objectContaining({ name: 'New Report' }),
      });
    });
  });

  describe('delete', () => {
    it('should soft delete report', async () => {
      const mockReport = {
        id: 'report-123',
        deletedAt: new Date(),
      };

      prismaMock.report.update.mockResolvedValue(mockReport as any);

      await repository.delete('report-123');

      expect(prismaMock.report.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
```

**2. Integration Tests (with test database)**

```typescript
// repositories/implementations/__tests__/PrismaReportRepository.integration.test.ts
import { PrismaReportRepository } from '../PrismaReportRepository';
import { prisma } from '@/lib/db';
import { ReportEntity } from '@/domain/entities/Report';

describe('PrismaReportRepository Integration', () => {
  let repository: PrismaReportRepository;
  let testUserId: string;

  beforeAll(async () => {
    repository = new PrismaReportRepository();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.report.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should save and retrieve report', async () => {
    const report = ReportEntity.create({
      userId: testUserId,
      name: 'Integration Test Report',
    });

    // Save
    await repository.save(report);

    // Retrieve
    const retrieved = await repository.findById(report.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Integration Test Report');
    expect(retrieved?.userId).toBe(testUserId);
  });

  it('should find all reports for user', async () => {
    // Create multiple reports
    const report1 = ReportEntity.create({
      userId: testUserId,
      name: 'Report 1',
    });
    const report2 = ReportEntity.create({
      userId: testUserId,
      name: 'Report 2',
    });

    await repository.save(report1);
    await repository.save(report2);

    // Retrieve all
    const reports = await repository.findByUserId(testUserId);

    expect(reports.length).toBeGreaterThanOrEqual(2);
    expect(reports.find((r) => r.id === report1.id)).toBeDefined();
    expect(reports.find((r) => r.id === report2.id)).toBeDefined();
  });
});
```

**Key Points:**

- ✅ Unit tests with mocked Prisma (fast, isolated)
- ✅ Integration tests with real DB (slower, confidence)
- ✅ Use test database (not production)
- ✅ Clean up after tests

---

### Service Layer (Business Logic - 95% Coverage)

**What to Test:**

- Business rules
- Authorization logic
- Error handling
- Service composition

**Approach: Unit tests with mocked repositories**

```typescript
// services/__tests__/ReportService.test.ts
import { ReportService } from '../ReportService';
import { IReportRepository } from '@/repositories/interfaces/IReportRepository';
import { ReportEntity } from '@/domain/entities/Report';

describe('ReportService', () => {
  let service: ReportService;
  let mockRepo: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    };
    service = new ReportService(mockRepo);
  });

  describe('createReport', () => {
    it('should create report with valid data', async () => {
      const userId = 'user-123';
      const name = 'Q4 Report';

      mockRepo.save.mockResolvedValue();

      const report = await service.createReport(userId, name);

      expect(report.name).toBe('Q4 Report');
      expect(report.userId).toBe(userId);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Q4 Report' }),
      );
    });

    it('should trim report name', async () => {
      const report = await service.createReport('user-123', '  Trimmed  ');

      expect(report.name).toBe('Trimmed');
    });
  });

  describe('getReport', () => {
    it('should return report when user is authorized', async () => {
      const mockReport = ReportEntity.create({
        userId: 'user-123',
        name: 'Test Report',
      });

      mockRepo.findById.mockResolvedValue(mockReport);

      const result = await service.getReport('report-123', 'user-123');

      expect(result).toEqual(mockReport);
    });

    it('should throw error when report not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getReport('nonexistent', 'user-123'),
      ).rejects.toThrow('Report not found');
    });

    it('should throw error when user unauthorized', async () => {
      const mockReport = ReportEntity.create({
        userId: 'owner-123',
        name: 'Private Report',
      });

      mockRepo.findById.mockResolvedValue(mockReport);

      await expect(
        service.getReport('report-123', 'other-user'),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateReport', () => {
    it('should update report name', async () => {
      const existingReport = ReportEntity.create({
        userId: 'user-123',
        name: 'Old Name',
      });

      mockRepo.findById.mockResolvedValue(existingReport);
      mockRepo.save.mockResolvedValue();

      const updated = await service.updateReport(
        existingReport.id,
        'user-123',
        { name: 'New Name' },
      );

      expect(updated.name).toBe('New Name');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    it('should update report content', async () => {
      const existingReport = ReportEntity.create({
        userId: 'user-123',
        name: 'Report',
      });

      mockRepo.findById.mockResolvedValue(existingReport);
      mockRepo.save.mockResolvedValue();

      const updated = await service.updateReport(
        existingReport.id,
        'user-123',
        { content: 'New content' },
      );

      expect(updated.content).toBe('New content');
    });
  });

  describe('deleteReport', () => {
    it('should delete report when authorized', async () => {
      const mockReport = ReportEntity.create({
        userId: 'user-123',
        name: 'To Delete',
      });

      mockRepo.findById.mockResolvedValue(mockReport);
      mockRepo.delete.mockResolvedValue();

      await service.deleteReport(mockReport.id, 'user-123');

      expect(mockRepo.delete).toHaveBeenCalledWith(mockReport.id);
    });

    it('should throw error when unauthorized', async () => {
      const mockReport = ReportEntity.create({
        userId: 'owner-123',
        name: 'Private',
      });

      mockRepo.findById.mockResolvedValue(mockReport);

      await expect(
        service.deleteReport(mockReport.id, 'other-user'),
      ).rejects.toThrow('Unauthorized');

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
```

**Key Points:**

- ✅ Mock all dependencies (repositories, external services)
- ✅ Test business rules thoroughly
- ✅ Test authorization logic
- ✅ Test error conditions
- ✅ Fast execution (no real I/O)

---

### API Layer (HTTP Endpoints - 90% Coverage)

**What to Test:**

- Request validation
- Authentication
- Response formatting
- Error handling
- Status codes

**Approach: Integration tests with supertest**

```typescript
// app/api/reports/__tests__/reports.test.ts
import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';

jest.mock('next-auth');

describe('GET /api/reports', () => {
  it('should return 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'GET' });
    await GET(req as any);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should return user reports when authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const { req, res } = createMocks({ method: 'GET' });
    await GET(req as any);

    expect(res._getStatusCode()).toBe(200);
    const reports = JSON.parse(res._getData());
    expect(Array.isArray(reports)).toBe(true);
  });
});

describe('POST /api/reports', () => {
  it('should create report with valid data', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'New Report' },
    });

    await POST(req as any);

    expect(res._getStatusCode()).toBe(201);
    const report = JSON.parse(res._getData());
    expect(report.name).toBe('New Report');
    expect(report.userId).toBe('user-123');
  });

  it('should return 400 when name missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await POST(req as any);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Name is required',
    });
  });
});
```

**Key Points:**

- ✅ Test authentication/authorization
- ✅ Test request validation
- ✅ Test error responses
- ✅ Mock external dependencies

---

### Frontend (React Components - 80% Coverage)

**What to Test:**

- User interactions
- Loading states
- Error states
- Data display
- Form validation

**Approach: React Testing Library (user-centric tests)**

```typescript
// components/reports/__tests__/ReportList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportList } from '../ReportList';
import { useReports } from '@/hooks/useReports';

jest.mock('@/hooks/useReports');

describe('ReportList', () => {
  it('should display loading state', () => {
    (useReports as jest.Mock).mockReturnValue({
      reports: [],
      isLoading: true,
      createReport: { mutateAsync: jest.fn() },
    });

    render(<ReportList />);

    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
  });

  it('should display reports when loaded', () => {
    (useReports as jest.Mock).mockReturnValue({
      reports: [
        { id: '1', name: 'Q4 Report', updatedAt: new Date() },
        { id: '2', name: 'Q3 Report', updatedAt: new Date() },
      ],
      isLoading: false,
      createReport: { mutateAsync: jest.fn() },
    });

    render(<ReportList />);

    expect(screen.getByText('Q4 Report')).toBeInTheDocument();
    expect(screen.getByText('Q3 Report')).toBeInTheDocument();
  });

  it('should show create form when button clicked', () => {
    (useReports as jest.Mock).mockReturnValue({
      reports: [],
      isLoading: false,
      createReport: { mutateAsync: jest.fn() },
    });

    render(<ReportList />);

    const newButton = screen.getByText('+ New Report');
    fireEvent.click(newButton);

    expect(screen.getByPlaceholderText('Report name...')).toBeInTheDocument();
  });

  it('should create report when form submitted', async () => {
    const mockCreateReport = jest.fn().mockResolvedValue({});
    (useReports as jest.Mock).mockReturnValue({
      reports: [],
      isLoading: false,
      createReport: { mutateAsync: mockCreateReport },
    });

    render(<ReportList />);

    // Open create form
    fireEvent.click(screen.getByText('+ New Report'));

    // Fill in name
    const input = screen.getByPlaceholderText('Report name...');
    fireEvent.change(input, { target: { value: 'New Report' } });

    // Submit
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalledWith('New Report');
    });
  });

  it('should not create report with empty name', () => {
    const mockCreateReport = jest.fn();
    (useReports as jest.Mock).mockReturnValue({
      reports: [],
      isLoading: false,
      createReport: { mutateAsync: mockCreateReport },
    });

    render(<ReportList />);

    fireEvent.click(screen.getByText('+ New Report'));
    fireEvent.click(screen.getByText('Create'));

    expect(mockCreateReport).not.toHaveBeenCalled();
  });
});
```

**Key Points:**

- ✅ Test from user's perspective
- ✅ Query by user-visible text (not implementation details)
- ✅ Test interactions (click, type, submit)
- ✅ Test loading and error states
- ❌ Don't test internal state
- ❌ Don't test implementation details

---

## 4. Test Organization

### Directory Structure

```
apex/
├── domain/
│   ├── entities/
│   │   ├── Report.ts
│   │   ├── Document.ts
│   │   └── __tests__/
│   │       ├── Report.test.ts
│   │       └── Document.test.ts
│   └── errors/
│       ├── NotFoundError.ts
│       └── __tests__/
│           └── errors.test.ts
│
├── services/
│   ├── ReportService.ts
│   ├── DocumentService.ts
│   └── __tests__/
│       ├── ReportService.test.ts
│       └── DocumentService.test.ts
│
├── repositories/
│   ├── interfaces/
│   │   ├── IReportRepository.ts
│   │   └── IDocumentRepository.ts
│   └── implementations/
│       ├── PrismaReportRepository.ts
│       ├── PrismaDocumentRepository.ts
│       └── __tests__/
│           ├── PrismaReportRepository.test.ts
│           ├── PrismaDocumentRepository.test.ts
│           ├── PrismaReportRepository.integration.test.ts
│           └── PrismaDocumentRepository.integration.test.ts
│
├── app/
│   └── api/
│       ├── reports/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   └── route.ts
│       │   └── __tests__/
│       │       ├── reports.test.ts
│       │       └── [id].test.ts
│       └── documents/
│           ├── route.ts
│           └── __tests__/
│               └── documents.test.ts
│
├── components/
│   ├── reports/
│   │   ├── ReportList.tsx
│   │   ├── ReportCard.tsx
│   │   └── __tests__/
│   │       ├── ReportList.test.tsx
│   │       └── ReportCard.test.tsx
│   └── documents/
│       ├── DocumentUpload.tsx
│       └── __tests__/
│           └── DocumentUpload.test.tsx
│
├── hooks/
│   ├── useReports.ts
│   ├── useDocuments.ts
│   └── __tests__/
│       ├── useReports.test.ts
│       └── useDocuments.test.ts
│
└── __tests__/
    ├── utils/
    │   ├── mocks.ts           # Common mocks
    │   ├── factories.ts       # Test data factories
    │   └── testHelpers.ts     # Test utilities
    ├── setup.ts               # Jest setup
    └── e2e/
        ├── auth.test.ts       # E2E tests
        └── reportFlow.test.ts
```

### Naming Conventions

**Test Files:**

- Unit tests: `ComponentName.test.ts`
- Integration tests: `ComponentName.integration.test.ts`
- E2E tests: `featureName.test.ts` (in `__tests__/e2e/`)

**Test Suites:**

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // test
    });
  });
});
```

**Test Descriptions:**

- Use "should" for behavior: `should create report when data valid`
- Be specific: `should throw error for empty name` not `should validate`
- Include condition: `should return 401 when not authenticated`

---

## 5. Test Patterns & Utilities

### Common Mocks

**File: `__tests__/utils/mocks.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Prisma Mock
export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

// NextAuth Session Mock
export const mockSession = (user?: { id: string; email: string } | null) => {
  const { getServerSession } = require('next-auth');
  (getServerSession as jest.Mock).mockResolvedValue(user ? { user } : null);
};

// File Upload Mock
export const mockFile = (name: string, type: string, content: string): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

// Repository Mock
export const mockRepository = <T>(): jest.Mocked<T> => {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  } as any;
};
```

### Test Data Factories

**File: `__tests__/utils/factories.ts`**

```typescript
import { Report } from '@/domain/entities/Report';
import { Document } from '@/domain/entities/Document';
import { ReportEntity } from '@/domain/entities/Report';
import { DocumentEntity } from '@/domain/entities/Document';

// Factory for creating test reports
export const createMockReport = (overrides?: Partial<Report>): Report => {
  return {
    id: overrides?.id || crypto.randomUUID(),
    userId: overrides?.userId || 'user-123',
    name: overrides?.name || 'Test Report',
    content: overrides?.content || '',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    deletedAt: overrides?.deletedAt || null,
  };
};

// Factory for creating test documents
export const createMockDocument = (overrides?: Partial<Document>): Document => {
  return {
    id: overrides?.id || crypto.randomUUID(),
    reportId: overrides?.reportId || 'report-123',
    filename: overrides?.filename || 'test.txt',
    fileHash: overrides?.fileHash || 'abc123',
    storagePath: overrides?.storagePath || '/storage/test.txt',
    parsedContent: overrides?.parsedContent || 'Parsed content',
    notes: overrides?.notes || '',
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    deletedAt: overrides?.deletedAt || null,
  };
};

// Factory for creating test users
export const createMockUser = (overrides?: {
  id?: string;
  email?: string;
  name?: string;
}) => {
  return {
    id: overrides?.id || 'user-123',
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Builder pattern for complex objects
export class ReportBuilder {
  private report: Partial<Report> = {};

  withId(id: string) {
    this.report.id = id;
    return this;
  }

  withUserId(userId: string) {
    this.report.userId = userId;
    return this;
  }

  withName(name: string) {
    this.report.name = name;
    return this;
  }

  withContent(content: string) {
    this.report.content = content;
    return this;
  }

  deleted() {
    this.report.deletedAt = new Date();
    return this;
  }

  build(): Report {
    return createMockReport(this.report);
  }
}

// Usage:
// const report = new ReportBuilder()
//   .withName('Q4 Report')
//   .withUserId('user-456')
//   .build();
```

### Custom Matchers

**File: `__tests__/utils/matchers.ts`**

```typescript
import { expect } from '@jest/globals';

// Custom matcher for validating Report objects
expect.extend({
  toBeValidReport(received: any) {
    const pass =
      typeof received.id === 'string' &&
      typeof received.userId === 'string' &&
      typeof received.name === 'string' &&
      typeof received.content === 'string' &&
      received.createdAt instanceof Date &&
      received.updatedAt instanceof Date;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Report`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Report`,
        pass: false,
      };
    }
  },

  // Custom matcher for UUID validation
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
});

// Extend TypeScript types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidReport(): R;
      toBeValidUUID(): R;
    }
  }
}
```

---

## 6. TDD Workflow Examples

### Example 1: Adding a New Feature (Report Tagging)

**Requirement**: Users should be able to add tags to reports

**Step 1: Write Test (RED)**

```typescript
// services/__tests__/ReportService.test.ts
describe('addTag', () => {
  it('should add tag to report when authorized', async () => {
    const report = createMockReport({ userId: 'user-123' });
    mockRepo.findById.mockResolvedValue(report);
    mockRepo.addTag.mockResolvedValue();

    await service.addTag('report-123', 'user-123', 'earnings');

    expect(mockRepo.addTag).toHaveBeenCalledWith('report-123', 'earnings');
  });

  it('should throw error when unauthorized', async () => {
    const report = createMockReport({ userId: 'owner-123' });
    mockRepo.findById.mockResolvedValue(report);

    await expect(
      service.addTag('report-123', 'other-user', 'earnings'),
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw error when tag is empty', async () => {
    const report = createMockReport({ userId: 'user-123' });
    mockRepo.findById.mockResolvedValue(report);

    await expect(service.addTag('report-123', 'user-123', '')).rejects.toThrow(
      'Tag cannot be empty',
    );
  });
});
```

**Run test:** ❌ Fails (method doesn't exist)

**Step 2: Implement (GREEN)**

```typescript
// services/ReportService.ts
export class ReportService {
  async addTag(reportId: string, userId: string, tag: string): Promise<void> {
    // Validate tag
    if (!tag || !tag.trim()) {
      throw new Error('Tag cannot be empty');
    }

    // Check authorization
    const report = await this.getReport(reportId, userId);

    // Add tag
    await this.reportRepository.addTag(reportId, tag.trim().toLowerCase());
  }
}
```

**Run test:** ✅ Passes

**Step 3: Refactor (REFACTOR)**

```typescript
// Extract validation
private validateTag(tag: string): string {
  if (!tag || !tag.trim()) {
    throw new ValidationError('Tag cannot be empty');
  }
  if (tag.length > 50) {
    throw new ValidationError('Tag too long (max 50 characters)');
  }
  return tag.trim().toLowerCase();
}

async addTag(reportId: string, userId: string, tag: string): Promise<void> {
  const validatedTag = this.validateTag(tag);
  const report = await this.getReport(reportId, userId);
  await this.reportRepository.addTag(reportId, validatedTag);
}
```

**Run test:** ✅ Still passes

**Step 4: Add More Tests**

```typescript
it('should normalize tag to lowercase', async () => {
  const report = createMockReport({ userId: 'user-123' });
  mockRepo.findById.mockResolvedValue(report);
  mockRepo.addTag.mockResolvedValue();

  await service.addTag('report-123', 'user-123', 'EARNINGS');

  expect(mockRepo.addTag).toHaveBeenCalledWith('report-123', 'earnings');
});

it('should trim whitespace from tag', async () => {
  const report = createMockReport({ userId: 'user-123' });
  mockRepo.findById.mockResolvedValue(report);
  mockRepo.addTag.mockResolvedValue();

  await service.addTag('report-123', 'user-123', '  earnings  ');

  expect(mockRepo.addTag).toHaveBeenCalledWith('report-123', 'earnings');
});
```

**Step 5: Commit**

```bash
git add services/ReportService.ts services/__tests__/ReportService.test.ts
git commit -m "feat: Add report tagging with validation (TDD)

- Users can add tags to reports
- Tags are validated (non-empty, max 50 chars)
- Tags normalized (lowercase, trimmed)
- Authorization enforced
- 100% test coverage"
```

---

### Example 2: Fixing a Bug (Report Name Validation)

**Bug Report**: Users can create reports with only whitespace names

**Step 1: Write Test for Bug (RED)**

```typescript
// domain/entities/__tests__/Report.test.ts
describe('create', () => {
  it('should throw error for whitespace-only name', () => {
    expect(() => {
      ReportEntity.create({ userId: 'user-123', name: '   ' });
    }).toThrow('Report name cannot be empty');
  });
});
```

**Run test:** ❌ Fails (bug reproduced)

**Step 2: Fix Bug (GREEN)**

```typescript
// domain/entities/Report.ts
static create(params: { userId: string; name: string }): Report {
  const trimmedName = params.name.trim();

  if (!trimmedName) {
    throw new Error('Report name cannot be empty');
  }

  return {
    id: crypto.randomUUID(),
    userId: params.userId,
    name: trimmedName,
    content: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
```

**Run test:** ✅ Passes (bug fixed)

**Step 3: Regression Test**

```bash
npm test -- Report.test.ts
```

All existing tests still pass ✅ (no regression)

**Step 4: Commit**

```bash
git add domain/entities/Report.ts domain/entities/__tests__/Report.test.ts
git commit -m "fix: Prevent creating reports with whitespace-only names

- Trim names before validation
- Reject whitespace-only names
- Add regression test"
```

---

## 7. Common Testing Scenarios

### Scenario 1: Testing Async Operations

```typescript
describe('uploadDocument', () => {
  it('should upload document and parse content', async () => {
    const mockFile = mockFile('test.pdf', 'application/pdf', 'content');

    // Mock storage service
    mockStorage.saveFile.mockResolvedValue('/storage/abc123.pdf');

    // Mock parser service
    mockParser.parse.mockResolvedValue('Parsed content');

    // Mock repository
    mockRepo.save.mockResolvedValue();

    const document = await service.uploadDocument(
      'report-123',
      mockFile,
      'test.pdf',
    );

    expect(document.filename).toBe('test.pdf');
    expect(document.parsedContent).toBe('Parsed content');
    expect(mockStorage.saveFile).toHaveBeenCalled();
    expect(mockParser.parse).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should handle parsing failure gracefully', async () => {
    const mockFile = mockFile('test.pdf', 'application/pdf', 'content');

    mockStorage.saveFile.mockResolvedValue('/storage/abc123.pdf');
    mockParser.parse.mockRejectedValue(new Error('Parsing failed'));
    mockRepo.save.mockResolvedValue();

    const document = await service.uploadDocument(
      'report-123',
      mockFile,
      'test.pdf',
    );

    // Document created but without parsed content
    expect(document.parsedContent).toBeNull();
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Scenario 2: Testing Error Handling

```typescript
describe('getReport', () => {
  it('should throw NotFoundError when report does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.getReport('nonexistent', 'user-123')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw UnauthorizedError when user not owner', async () => {
    const report = createMockReport({ userId: 'owner-123' });
    mockRepo.findById.mockResolvedValue(report);

    await expect(service.getReport('report-123', 'other-user')).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('should throw ValidationError for invalid ID format', async () => {
    await expect(service.getReport('invalid-id', 'user-123')).rejects.toThrow(
      ValidationError,
    );
  });
});
```

### Scenario 3: Testing Side Effects

```typescript
describe('deleteReport', () => {
  it('should delete associated documents', async () => {
    const report = createMockReport();
    const documents = [
      createMockDocument({ reportId: report.id }),
      createMockDocument({ reportId: report.id }),
    ];

    mockReportRepo.findById.mockResolvedValue(report);
    mockDocumentRepo.findByReportId.mockResolvedValue(documents);
    mockDocumentRepo.delete.mockResolvedValue();
    mockReportRepo.delete.mockResolvedValue();

    await service.deleteReport(report.id, report.userId);

    // Verify documents deleted first
    expect(mockDocumentRepo.delete).toHaveBeenCalledTimes(2);
    expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documents[0].id);
    expect(mockDocumentRepo.delete).toHaveBeenCalledWith(documents[1].id);

    // Then report deleted
    expect(mockReportRepo.delete).toHaveBeenCalledWith(report.id);
  });
});
```

### Scenario 4: Testing Race Conditions

```typescript
describe('updateReport concurrency', () => {
  it('should handle concurrent updates correctly', async () => {
    const report = createMockReport();
    mockRepo.findById.mockResolvedValue(report);
    mockRepo.save.mockResolvedValue();

    // Simulate concurrent updates
    const update1 = service.updateReport(report.id, 'user-123', {
      name: 'Name 1',
    });
    const update2 = service.updateReport(report.id, 'user-123', {
      content: 'Content 2',
    });

    const [result1, result2] = await Promise.all([update1, update2]);

    // Both updates should succeed
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
  });
});
```

---

## 8. CI/CD Integration

### Pre-commit Hook (Husky + lint-staged)

**File: `.husky/pre-commit`**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests on staged files
npm test -- --bail --findRelatedTests $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
```

**File: `package.json`**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "jest --bail --findRelatedTests"]
  }
}
```

### GitHub Actions Workflow

**File: `.github/workflows/test.yml`**

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: apex_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage --testPathIgnorePatterns=integration

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/apex_test
        run: npm test -- --testPathPattern=integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Check coverage thresholds
        run: |
          npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":90,"lines":90,"statements":90}}'
```

### Test Scripts

**File: `package.json`**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathIgnorePatterns=integration",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:changed": "jest --changedSince=main",
    "test:related": "jest --bail --findRelatedTests"
  }
}
```

---

## 9. Coverage Goals & Metrics

### Coverage Targets

| Layer            | Line Coverage | Branch Coverage | Function Coverage |
| ---------------- | ------------- | --------------- | ----------------- |
| **Domain**       | 100%          | 100%            | 100%              |
| **Services**     | 95%           | 95%             | 95%               |
| **Repositories** | 90%           | 85%             | 90%               |
| **API Routes**   | 90%           | 85%             | 90%               |
| **Hooks**        | 85%           | 80%             | 85%               |
| **Components**   | 80%           | 75%             | 80%               |
| **Overall**      | 90%           | 85%             | 90%               |

### Jest Configuration for Coverage

**File: `jest.config.js`**

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './domain/**/*.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './services/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{ts,js}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
};
```

### Viewing Coverage Reports

```bash
# Generate HTML coverage report
npm test -- --coverage

# Open in browser
open coverage/lcov-report/index.html
```

### Metrics to Track

**Code Coverage:**

- Line coverage: % of lines executed
- Branch coverage: % of if/else branches taken
- Function coverage: % of functions called
- Statement coverage: % of statements executed

**Test Metrics:**

- Total tests: 100+
- Test execution time: < 30 seconds (unit), < 2 minutes (integration)
- Test flakiness: < 1% (tests that fail randomly)
- Test-to-code ratio: 1:1 or higher (more test code than production code)

**Quality Metrics:**

- Bug escape rate: < 5% (bugs found in production)
- Time to fix: < 1 hour for critical, < 1 day for major
- Refactoring confidence: High (tests enable fearless refactoring)

---

## 10. Troubleshooting & FAQ

### Common Issues

**Issue 1: "Cannot find module" errors in tests**

```typescript
// Solution: Add moduleNameMapper in jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

**Issue 2: Tests pass locally but fail in CI**

```bash
# Solution: Ensure environment variables set in CI
# Check .github/workflows/test.yml
env:
  DATABASE_URL: postgresql://...
  NEXTAUTH_SECRET: test-secret
```

**Issue 3: Slow test execution**

```typescript
// Solution: Run tests in parallel
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Use 50% of CPU cores
};
```

**Issue 4: Flaky tests (randomly fail)**

```typescript
// Common causes:
// 1. Race conditions
// 2. Shared state between tests
// 3. Time-dependent tests
// 4. External dependencies

// Solutions:
// 1. Use jest.useFakeTimers() for time
// 2. Clear mocks in beforeEach
// 3. Isolate test data
// 4. Mock external APIs
```

### FAQ

**Q: How long should tests take to run?**
A: Unit tests < 30 seconds, integration tests < 2 minutes, E2E tests < 5 minutes

**Q: Should I test private methods?**
A: No, test public API only. Private methods are implementation details.

**Q: How many tests should I write?**
A: Enough to reach coverage targets. Quality > quantity.

**Q: Should I mock the database?**
A: For unit tests: yes. For integration tests: use test database.

**Q: What if implementation changes and breaks tests?**
A: Good! Tests caught a breaking change. Update tests if behavior should change.

**Q: Can I skip writing tests for simple code?**
A: No. Even simple code can have bugs. TDD forces you to think about edge cases.

**Q: How do I test code that depends on current time?**
A: Use `jest.useFakeTimers()` and control time in tests.

**Q: Should I test third-party libraries?**
A: No, assume they work. Mock them and test your integration with them.

---

## Summary

### TDD Checklist

For every feature:

- [ ] Write failing test (RED)
- [ ] Run test and verify it fails
- [ ] Write minimal code to pass (GREEN)
- [ ] Run test and verify it passes
- [ ] Refactor while keeping tests green (REFACTOR)
- [ ] Run all tests to prevent regression
- [ ] Commit test + implementation together
- [ ] Verify coverage meets targets

### Key Principles

1. **Test-first, always** - No production code without failing test
2. **Red-Green-Refactor** - Follow the cycle strictly
3. **Fast tests** - Unit tests should run in seconds
4. **Isolated tests** - No shared state, no test interdependencies
5. **Readable tests** - Tests are documentation
6. **High coverage** - 90%+ overall, 100% for critical code
7. **CI/CD enforced** - Tests block merges if failing

### Benefits Recap

✅ **Better design** - TDD forces clean architecture
✅ **Fewer bugs** - Catch issues at write-time
✅ **Refactoring confidence** - Change code fearlessly
✅ **Living documentation** - Tests show usage
✅ **Faster development** - Initial 30% slower, 3x faster long-term

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Maintained By**: Apex Development Team
**Related Docs**:

- `DEVELOPER-GUIDE.md` - Step-by-step implementation
- `TECHNICAL-SPECIFICATION.md` - Architecture overview
- `TECHNICAL-DECISIONS.md` - Decision #16 (Testing Methodology)

**Status**: ✅ Active Development Practice

---

_Master TDD, master Apex. Write tests first, build confidence, ship quality._
