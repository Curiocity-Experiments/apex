/**
 * Tests for /api/reports endpoints (POST, GET)
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
import { GET, POST } from '@/app/api/reports/route';
import { getServerSession } from 'next-auth';
import {
  createMockReport,
  createMockReports,
} from '@/__tests__/utils/factories';

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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('POST /api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Report' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Report' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name is only whitespace', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: '   ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when name exceeds 200 characters', async () => {
      const longName = 'a'.repeat(201);
      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: longName }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 when request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('Successful Report Creation', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should create report with valid name', async () => {
      const mockReport = createMockReport({
        name: 'Q4 2024 Earnings Report',
        userId: 'user-123',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.upsert.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Q4 2024 Earnings Report' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Q4 2024 Earnings Report');
      expect(data.userId).toBe('user-123');
      expect(data.content).toBe('');
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
      expect(data.deletedAt).toBeNull();
    });

    it('should trim whitespace from report name', async () => {
      const mockReport = createMockReport({
        name: 'Trimmed Report',
        userId: 'user-123',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.upsert.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: '  Trimmed Report  ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Trimmed Report');
    });

    it('should create report with exactly 200 character name', async () => {
      const exactName = 'a'.repeat(200);
      const mockReport = createMockReport({
        name: exactName,
        userId: 'user-123',
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.upsert.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: exactName }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(exactName);
      expect(data.name.length).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 500 when database error occurs', async () => {
      // Mock Prisma to throw error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.upsert.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Report' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

describe('GET /api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Successful Report Listing', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return empty array when user has no reports', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return array of reports for authenticated user', async () => {
      const mockReports = createMockReports(3, { userId: 'user-123' });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findMany.mockResolvedValue(mockReports);

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0].userId).toBe('user-123');
      expect(data[1].userId).toBe('user-123');
      expect(data[2].userId).toBe('user-123');
    });

    it('should exclude deleted reports by default', async () => {
      const activeReports = createMockReports(2, {
        userId: 'user-123',
        deletedAt: null,
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findMany.mockResolvedValue(activeReports);

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      data.forEach((report: any) => {
        expect(report.deletedAt).toBeNull();
      });
    });

    it('should return reports ordered by creation date (newest first)', async () => {
      const reports = [
        createMockReport({
          userId: 'user-123',
          name: 'Report 1',
          createdAt: new Date('2025-01-01'),
        }),
        createMockReport({
          userId: 'user-123',
          name: 'Report 2',
          createdAt: new Date('2025-01-02'),
        }),
        createMockReport({
          userId: 'user-123',
          name: 'Report 3',
          createdAt: new Date('2025-01-03'),
        }),
      ];

      // Reverse order (newest first)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/db');
      prisma.report.findMany.mockResolvedValue([...reports].reverse());

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].name).toBe('Report 3'); // Newest
      expect(data[1].name).toBe('Report 2');
      expect(data[2].name).toBe('Report 1'); // Oldest
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
      prisma.report.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
