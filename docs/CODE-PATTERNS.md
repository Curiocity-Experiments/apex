# Code Patterns

This document contains detailed code examples and patterns used throughout the Apex application.

## Table of Contents

- [API Route Patterns](#api-route-patterns)
- [Repository Pattern](#repository-pattern)
- [Use Case Pattern](#use-case-pattern)
- [Database Query Patterns](#database-query-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Authentication Patterns](#authentication-patterns)
- [Testing Patterns](#testing-patterns)

## API Route Patterns

### Basic GET Route with Authentication

```typescript
// app/api/reports/route.ts
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null, // Always filter soft-deleted records
      },
      include: {
        reportTags: true,
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return Response.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
```

### POST Route with Validation

```typescript
// app/api/reports/route.ts
import { z } from 'zod';

const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createReportSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, content, tags } = validation.data;

    const report = await prisma.report.create({
      data: {
        name,
        content,
        userId: session.user.id,
        reportTags: tags
          ? {
              create: tags.map((tag) => ({ tag })),
            }
          : undefined,
      },
      include: {
        reportTags: true,
      },
    });

    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return Response.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
```

### Dynamic Route with Path Parameters

```typescript
// app/api/reports/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        reportTags: true,
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    return Response.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return Response.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
```

## Repository Pattern

### Repository Interface

```typescript
// domain/repositories/IReportRepository.ts
import { Report } from '@/domain/entities/Report';
import { CreateReportDTO, UpdateReportDTO } from '@/domain/dtos/ReportDTO';

export interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  findByUserId(userId: string): Promise<Report[]>;
  create(data: CreateReportDTO): Promise<Report>;
  update(id: string, data: UpdateReportDTO): Promise<Report>;
  softDelete(id: string): Promise<void>;
  permanentDelete(id: string): Promise<void>;
}
```

### Repository Implementation

```typescript
// infrastructure/repositories/PrismaReportRepository.ts
import { prisma } from '@/lib/db';
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { Report } from '@/domain/entities/Report';
import { CreateReportDTO, UpdateReportDTO } from '@/domain/dtos/ReportDTO';

export class PrismaReportRepository implements IReportRepository {
  async findById(id: string): Promise<Report | null> {
    const report = await prisma.report.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        reportTags: true,
        _count: { select: { documents: true } },
      },
    });

    return report as Report | null;
  }

  async findByUserId(userId: string): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        reportTags: true,
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports as Report[];
  }

  async create(data: CreateReportDTO): Promise<Report> {
    const report = await prisma.report.create({
      data: {
        name: data.name,
        content: data.content,
        userId: data.userId,
        reportTags: data.tags
          ? {
              create: data.tags.map((tag) => ({ tag })),
            }
          : undefined,
      },
      include: {
        reportTags: true,
        _count: { select: { documents: true } },
      },
    });

    return report as Report;
  }

  async update(id: string, data: UpdateReportDTO): Promise<Report> {
    const report = await prisma.report.update({
      where: { id },
      data: {
        name: data.name,
        content: data.content,
        updatedAt: new Date(),
      },
      include: {
        reportTags: true,
        _count: { select: { documents: true } },
      },
    });

    return report as Report;
  }

  async softDelete(id: string): Promise<void> {
    await prisma.report.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async permanentDelete(id: string): Promise<void> {
    await prisma.report.delete({
      where: { id },
    });
  }
}
```

## Use Case Pattern

### Basic Use Case

```typescript
// domain/use-cases/CreateReportUseCase.ts
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { Report } from '@/domain/entities/Report';
import { CreateReportDTO } from '@/domain/dtos/ReportDTO';

export class CreateReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(data: CreateReportDTO): Promise<Report> {
    // Validate business rules
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Report name is required');
    }

    if (data.name.length > 255) {
      throw new Error('Report name must be less than 255 characters');
    }

    // Delegate to repository
    return await this.reportRepository.create(data);
  }
}
```

### Use Case with Multiple Repositories

```typescript
// domain/use-cases/DeleteReportUseCase.ts
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';

export class DeleteReportUseCase {
  constructor(
    private reportRepository: IReportRepository,
    private documentRepository: IDocumentRepository
  ) {}

  async execute(reportId: string, userId: string): Promise<void> {
    // Verify ownership
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Unauthorized to delete this report');
    }

    // Soft delete associated documents first
    const documents = await this.documentRepository.findByReportId(reportId);
    for (const document of documents) {
      await this.documentRepository.softDelete(document.id);
    }

    // Soft delete the report
    await this.reportRepository.softDelete(reportId);
  }
}
```

## Database Query Patterns

### Soft Delete Queries

```typescript
// Always filter out soft-deleted records
const reports = await prisma.report.findMany({
  where: {
    userId: user.id,
    deletedAt: null, // Required for soft-deleted models
  },
});

// Include soft-deleted records (rare, usually only for admin views)
const allReports = await prisma.report.findMany({
  where: {
    userId: user.id,
  },
});

// Soft delete operation
await prisma.report.update({
  where: { id: reportId },
  data: { deletedAt: new Date() },
});

// Restore soft-deleted record
await prisma.report.update({
  where: { id: reportId },
  data: { deletedAt: null },
});
```

### Transactions

```typescript
// Use transactions for operations that modify multiple tables
await prisma.$transaction(async (tx) => {
  const report = await tx.report.create({
    data: {
      name: 'New Report',
      content: 'Content',
      userId: user.id,
    },
  });

  await tx.document.createMany({
    data: documents.map((doc) => ({
      reportId: report.id,
      fileHash: doc.hash,
      storagePath: doc.path,
      fileName: doc.name,
    })),
  });

  return report;
});
```

### Handling Unique Constraint Violations

```typescript
import { Prisma } from '@prisma/client';

try {
  const report = await prisma.report.create({
    data: {
      name: 'Report Name',
      userId: user.id,
    },
  });
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    // Unique constraint violation
    const field = error.meta?.target;
    throw new Error(`A record with this ${field} already exists`);
  }
  throw error;
}
```

### Complex Queries with Relations

```typescript
// Get reports with document counts and tags
const reports = await prisma.report.findMany({
  where: {
    userId: user.id,
    deletedAt: null,
  },
  include: {
    reportTags: true,
    _count: {
      select: {
        documents: {
          where: { deletedAt: null },
        },
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});

// Get report with all documents and their tags
const report = await prisma.report.findUnique({
  where: { id: reportId },
  include: {
    reportTags: true,
    documents: {
      where: { deletedAt: null },
      include: {
        documentTags: true,
      },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

## Error Handling Patterns

### API Route Error Handling

```typescript
export async function POST(request: Request) {
  try {
    // ... operation
    return Response.json(data);
  } catch (error) {
    console.error('Operation failed:', error);

    // Handle specific error types
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return Response.json(
          { error: 'A record with this value already exists' },
          { status: 409 }
        );
      }
      if (error.code === 'P2025') {
        return Response.json({ error: 'Record not found' }, { status: 404 });
      }
    }

    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
```

### Use Case Error Handling

```typescript
export class CreateReportUseCase {
  async execute(data: CreateReportDTO): Promise<Report> {
    // Validate and throw business logic errors
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Report name is required');
    }

    // Let repository errors bubble up
    return await this.reportRepository.create(data);
  }
}
```

## Authentication Patterns

### Protecting API Routes

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // session.user.id is available
  // session.user.email is available
}
```

### Protecting Server Components

```typescript
// app/(dashboard)/reports/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Render protected content
  return <div>Reports for {session.user.email}</div>;
}
```

### Protecting Client Components

```typescript
// components/reports/report-list.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export function ReportList() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  return <div>Reports for {session?.user?.email}</div>;
}
```

## Testing Patterns

### Use Case Tests

```typescript
// __tests__/domain/use-cases/CreateReportUseCase.test.ts
import { CreateReportUseCase } from '@/domain/use-cases/CreateReportUseCase';
import { IReportRepository } from '@/domain/repositories/IReportRepository';
import { Report } from '@/domain/entities/Report';

describe('CreateReportUseCase', () => {
  let mockRepository: jest.Mocked<IReportRepository>;
  let useCase: CreateReportUseCase;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      permanentDelete: jest.fn(),
    };

    useCase = new CreateReportUseCase(mockRepository);
  });

  it('creates report with valid data', async () => {
    const reportData = {
      userId: 'user-123',
      name: 'Q4 Analysis',
      content: '# Content',
    };

    const expectedReport = {
      id: 'report-123',
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as Report;

    mockRepository.create.mockResolvedValue(expectedReport);

    const result = await useCase.execute(reportData);

    expect(result.name).toBe('Q4 Analysis');
    expect(mockRepository.create).toHaveBeenCalledWith(reportData);
  });

  it('throws error when name is empty', async () => {
    const reportData = {
      userId: 'user-123',
      name: '',
      content: '# Content',
    };

    await expect(useCase.execute(reportData)).rejects.toThrow(
      'Report name is required'
    );

    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});
```

### API Route Tests

```typescript
// __tests__/app/api/reports/route.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/reports/route';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('GET /api/reports', () => {
  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns reports for authenticated user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

### Component Tests

```typescript
// __tests__/components/reports/report-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportCard } from '@/components/reports/report-card';
import { Report } from '@/domain/entities/Report';

describe('ReportCard', () => {
  const mockReport: Report = {
    id: 'report-123',
    name: 'Q4 Analysis',
    content: '# Analysis',
    userId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  it('renders report name', () => {
    render(<ReportCard report={mockReport} />);
    expect(screen.getByText('Q4 Analysis')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();
    render(<ReportCard report={mockReport} onDelete={handleDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith('report-123');
  });
});
```

## Common Database Operations

### Get all reports for a user

```typescript
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

### Create report with tags

```typescript
const report = await prisma.report.create({
  data: {
    name: 'New Report',
    content: '# Content',
    userId: user.id,
    reportTags: {
      create: [{ tag: 'finance' }, { tag: 'analysis' }],
    },
  },
  include: {
    reportTags: true,
  },
});
```

### Upload document with deduplication

```typescript
// Check if document already exists in this report
const existingDoc = await prisma.document.findFirst({
  where: {
    reportId: report.id,
    fileHash: calculatedHash,
    deletedAt: null,
  },
});

if (existingDoc) {
  throw new Error('Document already exists in this report');
}

// Create new document
const document = await prisma.document.create({
  data: {
    reportId: report.id,
    fileHash: calculatedHash,
    fileName: file.name,
    storagePath: `/storage/${calculatedHash}`,
    parsedContent: parsedMarkdown,
  },
});
```

### Search reports by name or content

```typescript
const searchTerm = 'analysis';

const reports = await prisma.report.findMany({
  where: {
    userId: user.id,
    deletedAt: null,
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { content: { contains: searchTerm, mode: 'insensitive' } },
    ],
  },
});
```
