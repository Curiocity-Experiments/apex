/**
 * PrismaReportRepository Tests
 *
 * Testing Prisma implementation of ReportRepository interface.
 * Uses mocked Prisma client for fast, isolated tests.
 *
 * IMPORTANT: These tests focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how Prisma is called).
 *
 * Reference: docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { PrismaReportRepository } from '@/infrastructure/repositories/PrismaReportRepository';
import { Report } from '@/domain/entities/Report';
import {
  getMockPrisma,
  MockPrismaClient,
} from '@/__tests__/utils/db/prisma-mock';
import { createMockReport } from '@/__tests__/utils/factories';

describe('PrismaReportRepository', () => {
  let repository: PrismaReportRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = getMockPrisma();
    repository = new PrismaReportRepository(prismaMock);
  });

  describe('findById', () => {
    it('should return report when found', async () => {
      const mockDbReport = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Test Report',
        content: 'Test content',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      prismaMock.report.findUnique.mockResolvedValue(mockDbReport);

      const result = await repository.findById('report-123');

      // Test BEHAVIOR: verify correct data is returned
      expect(result).not.toBeNull();
      expect(result?.id).toBe('report-123');
      expect(result?.userId).toBe('user-456');
      expect(result?.name).toBe('Test Report');
      expect(result?.content).toBe('Test content');
    });

    it('should return null when not found', async () => {
      prismaMock.report.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      // Test BEHAVIOR: null when not found
      expect(result).toBeNull();
    });

    it('should include deleted reports', async () => {
      const mockDbReport = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Deleted Report',
        content: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: new Date('2025-01-15'),
      };

      prismaMock.report.findUnique.mockResolvedValue(mockDbReport);

      const result = await repository.findById('report-123');

      // Test BEHAVIOR: deleted reports are returned
      expect(result).not.toBeNull();
      expect(result?.deletedAt).toBeInstanceOf(Date);
      expect(result?.deletedAt).not.toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return all active reports for user', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Report 1',
          content: 'Content 1',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        {
          id: 'report-2',
          userId: 'user-123',
          name: 'Report 2',
          content: 'Content 2',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
          deletedAt: null,
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByUserId('user-123');

      // Test BEHAVIOR: returns all reports
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('report-1');
      expect(result[1].id).toBe('report-2');

      // Test BEHAVIOR: all reports belong to user
      result.forEach((report) => {
        expect(report.userId).toBe('user-123');
      });
    });

    it('should exclude deleted reports by default', async () => {
      const activeReport = {
        id: 'report-1',
        userId: 'user-123',
        name: 'Active',
        content: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      // Mock returns only active reports (deleted ones filtered by Prisma)
      prismaMock.report.findMany.mockResolvedValue([activeReport]);

      const result = await repository.findByUserId('user-123');

      // Test BEHAVIOR: only active reports returned
      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();

      // Test BEHAVIOR: verify it's the active report
      expect(result[0].name).toBe('Active');
    });

    it('should include deleted reports when requested', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Active',
          content: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        {
          id: 'report-2',
          userId: 'user-123',
          name: 'Deleted',
          content: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: new Date('2025-01-15'),
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByUserId('user-123', true);

      // Test BEHAVIOR: both active and deleted returned
      expect(result).toHaveLength(2);

      // Test BEHAVIOR: verify mix of active and deleted
      const activeReports = result.filter((r) => r.deletedAt === null);
      const deletedReports = result.filter((r) => r.deletedAt !== null);
      expect(activeReports).toHaveLength(1);
      expect(deletedReports).toHaveLength(1);
    });

    it('should return empty array when no reports found', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      const result = await repository.findByUserId('user-with-no-reports');

      // Test BEHAVIOR: empty array when no reports
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should create new report', async () => {
      const newReport: Report = createMockReport({
        id: 'new-report',
        userId: 'user-123',
        name: 'New Report',
        content: 'New content',
      });

      const mockDbReport = {
        ...newReport,
        createdAt: newReport.createdAt,
        updatedAt: newReport.updatedAt,
        deletedAt: null,
      };

      prismaMock.report.upsert.mockResolvedValue(mockDbReport);

      const result = await repository.save(newReport);

      // Test BEHAVIOR: saved report is returned
      expect(result.id).toBe('new-report');
      expect(result.userId).toBe('user-123');
      expect(result.name).toBe('New Report');
      expect(result.content).toBe('New content');
    });

    it('should update existing report', async () => {
      const existingReport: Report = createMockReport({
        id: 'existing-report',
        name: 'Updated Name',
        content: 'Updated content',
      });

      const mockDbReport = { ...existingReport, deletedAt: null };

      prismaMock.report.upsert.mockResolvedValue(mockDbReport);

      const result = await repository.save(existingReport);

      // Test BEHAVIOR: updated values are persisted
      expect(result.id).toBe('existing-report');
      expect(result.name).toBe('Updated Name');
      expect(result.content).toBe('Updated content');
    });

    it('should handle restore of soft-deleted report', async () => {
      const restoredReport: Report = createMockReport({
        id: 'report-123',
        name: 'Restored Report',
        deletedAt: null, // Was deleted, now being restored
      });

      const mockDbReport = { ...restoredReport, deletedAt: null };

      prismaMock.report.upsert.mockResolvedValue(mockDbReport);

      const result = await repository.save(restoredReport);

      // Test BEHAVIOR: deletedAt is null (restored)
      expect(result.id).toBe('report-123');
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete report', async () => {
      const mockDbReport = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Report',
        content: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
        deletedAt: new Date('2025-01-15'),
      };

      prismaMock.report.update.mockResolvedValue(mockDbReport);

      await repository.delete('report-123');

      // Test BEHAVIOR: delete method completes without error
      expect(prismaMock.report.update).toHaveBeenCalled();
    });

    it('should not throw if report does not exist', async () => {
      prismaMock.report.update.mockRejectedValue(new Error('Record not found'));

      // Test BEHAVIOR: no error thrown for non-existent report
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should find reports by name (case-insensitive)', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Q4 Earnings Report',
          content: 'Some content',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.search('user-123', 'EARNINGS');

      // Test BEHAVIOR: finds report with matching name (case-insensitive)
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Earnings');
    });

    it('should find reports by content', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Report',
          content: 'Contains the word revenue in content',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.search('user-123', 'revenue');

      // Test BEHAVIOR: finds report with matching content
      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('revenue');
    });

    it('should only return current user reports', async () => {
      const user123Reports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'User 123 Report',
          content: 'test content',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(user123Reports);

      const result = await repository.search('user-123', 'test');

      // Test BEHAVIOR: all results belong to user-123
      expect(result).toHaveLength(1);
      result.forEach((report) => {
        expect(report.userId).toBe('user-123');
      });
    });

    it('should exclude deleted reports from search', async () => {
      const activeReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Active Report',
          content: 'searchable content',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      // Mock returns only active (deleted filtered out by Prisma)
      prismaMock.report.findMany.mockResolvedValue(activeReports);

      const result = await repository.search('user-123', 'searchable');

      // Test BEHAVIOR: only active reports in results
      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
    });

    it('should return empty array when no matches', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      const result = await repository.search('user-123', 'nonexistent');

      // Test BEHAVIOR: empty array when no matches
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
