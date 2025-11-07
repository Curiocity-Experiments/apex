/**
 * Tests for /api/reports/[id] endpoints (GET, PATCH, DELETE)
 *
 * IMPORTANT: These tests focus on BEHAVIOR (what HTTP responses return),
 * not IMPLEMENTATION (how services are called).
 *
 * @see docs/TDD-GUIDE.md - Section 3.4 (API Layer Testing)
 * @see docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/reports/[id]/route';
import { getServerSession } from 'next-auth';
import { createMockReport } from '@/__tests__/utils/factories';

// Mock next-auth
jest.mock('next-auth');

// Mock the auth config to avoid nodemailer dependency
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    report: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('GET /api/reports/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 404 when report does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/nonexistent',
      );
      const response = await GET(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 403 when user does not own the report', async () => {
      const mockReport = createMockReport({ userId: 'other-user' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });
  });

  describe('Successful Report Retrieval', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return report when user owns it', async () => {
      const mockReport = createMockReport({
        id: 'report-123',
        userId: 'user-123',
        name: 'Test Report',
        content: 'Test content',
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('report-123');
      expect(data.userId).toBe('user-123');
      expect(data.name).toBe('Test Report');
      expect(data.content).toBe('Test content');
    });

    it('should not return deleted reports', async () => {
      // Mock repository to return null for deleted reports (repository behavior)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 500 when database error occurs', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
      );
      const response = await GET(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

describe('PATCH /api/reports/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 404 when report does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/nonexistent',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 403 when user does not own the report', async () => {
      const mockReport = createMockReport({ userId: 'other-user' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const mockReport = createMockReport({ userId: 'user-123' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);
    });

    it('should return 400 when both name and content are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name is empty string', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: '' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name is only whitespace', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: '   ' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name exceeds 200 characters', async () => {
      const longName = 'a'.repeat(201);
      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: longName }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('Successful Report Update', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should update report name only', async () => {
      const originalReport = createMockReport({
        id: 'report-123',
        userId: 'user-123',
        name: 'Original Name',
        content: 'Original Content',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(originalReport);
      prisma.report.upsert.mockResolvedValue({
        ...originalReport,
        name: 'Updated Name',
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated Name' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(data.content).toBe('Original Content'); // Unchanged
    });

    it('should update report content only', async () => {
      const originalReport = createMockReport({
        id: 'report-123',
        userId: 'user-123',
        name: 'Original Name',
        content: 'Original Content',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(originalReport);
      prisma.report.upsert.mockResolvedValue({
        ...originalReport,
        content: 'Updated Content',
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ content: 'Updated Content' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Updated Content');
      expect(data.name).toBe('Original Name'); // Unchanged
    });

    it('should update both name and content', async () => {
      const originalReport = createMockReport({
        id: 'report-123',
        userId: 'user-123',
        name: 'Original Name',
        content: 'Original Content',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(originalReport);
      prisma.report.upsert.mockResolvedValue({
        ...originalReport,
        name: 'Updated Name',
        content: 'Updated Content',
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Updated Name',
            content: 'Updated Content',
          }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(data.content).toBe('Updated Content');
    });

    it('should trim whitespace from updated name', async () => {
      const originalReport = createMockReport({
        userId: 'user-123',
        name: 'Original Name',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(originalReport);
      prisma.report.upsert.mockResolvedValue({
        ...originalReport,
        name: 'Trimmed Name',
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: '  Trimmed Name  ' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Trimmed Name');
    });

    it('should update the updatedAt timestamp', async () => {
      const oldDate = new Date('2025-01-01');
      const newDate = new Date('2025-01-02');

      const originalReport = createMockReport({
        userId: 'user-123',
        updatedAt: oldDate,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(originalReport);
      prisma.report.upsert.mockResolvedValue({
        ...originalReport,
        name: 'Updated',
        updatedAt: newDate,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(
        oldDate.getTime(),
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 500 when database error occurs', async () => {
      const mockReport = createMockReport({ userId: 'user-123' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);
      prisma.report.upsert.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Updated' }),
        },
      );

      const response = await PATCH(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

describe('DELETE /api/reports/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 404 when report does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/nonexistent',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 403 when user does not own the report', async () => {
      const mockReport = createMockReport({ userId: 'other-user' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });
  });

  describe('Successful Report Deletion', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should soft delete report (set deletedAt timestamp)', async () => {
      const mockReport = createMockReport({
        id: 'report-123',
        userId: 'user-123',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);
      prisma.report.update.mockResolvedValue({
        ...mockReport,
        deletedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });

      expect(response.status).toBe(204);
    });

    it('should return no content (204) on successful deletion', async () => {
      const mockReport = createMockReport({ userId: 'user-123' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findUnique.mockResolvedValue(mockReport);
      prisma.report.update.mockResolvedValue({
        ...mockReport,
        deletedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 500 when database error occurs', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');

      // Mock findUnique to throw a database error
      // This will cause getReport to fail before delete is even called
      prisma.report.findUnique.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reports/report-123',
        {
          method: 'DELETE',
        },
      );

      const response = await DELETE(request, { params: { id: 'report-123' } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
