/**
 * PrismaReportRepository Tests
 *
 * Testing Prisma implementation of ReportRepository interface.
 * Uses mocked Prisma client for fast, isolated tests.
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

      expect(result).not.toBeNull();
      expect(result?.id).toBe('report-123');
      expect(result?.name).toBe('Test Report');
      expect(prismaMock.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
      });
    });

    it('should return null when not found', async () => {
      prismaMock.report.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

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

      expect(result?.deletedAt).not.toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return active reports for user', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          userId: 'user-123',
          name: 'Report 1',
          content: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        {
          id: 'report-2',
          userId: 'user-123',
          name: 'Report 2',
          content: '',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
          deletedAt: null,
        },
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(prismaMock.report.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should exclude deleted reports by default', async () => {
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
      ];

      prismaMock.report.findMany.mockResolvedValue(mockDbReports);

      await repository.findByUserId('user-123');

      expect(prismaMock.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
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

      expect(result).toHaveLength(2);
      expect(prismaMock.report.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no reports found', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      const result = await repository.findByUserId('user-with-no-reports');

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create new report', async () => {
      const newReport: Report = createMockReport({
        id: 'new-report',
        userId: 'user-123',
        name: 'New Report',
      });

      const mockDbReport = {
        ...newReport,
        createdAt: newReport.createdAt,
        updatedAt: newReport.updatedAt,
        deletedAt: null,
      };

      prismaMock.report.upsert.mockResolvedValue(mockDbReport);

      const result = await repository.save(newReport);

      expect(result.id).toBe('new-report');
      expect(prismaMock.report.upsert).toHaveBeenCalledWith({
        where: { id: 'new-report' },
        create: {
          id: 'new-report',
          userId: 'user-123',
          name: 'New Report',
          content: newReport.content,
          createdAt: newReport.createdAt,
          updatedAt: newReport.updatedAt,
          deletedAt: null,
        },
        update: {
          name: 'New Report',
          content: newReport.content,
          updatedAt: newReport.updatedAt,
          deletedAt: null,
        },
      });
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

      expect(result.name).toBe('Updated Name');
      expect(result.content).toBe('Updated content');
    });

    it('should handle restore of soft-deleted report', async () => {
      const restoredReport: Report = createMockReport({
        id: 'report-123',
        deletedAt: null, // Was deleted, now being restored
      });

      const mockDbReport = { ...restoredReport, deletedAt: null };

      prismaMock.report.upsert.mockResolvedValue(mockDbReport);

      const result = await repository.save(restoredReport);

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

      expect(prismaMock.report.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: {
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should not throw if report does not exist', async () => {
      prismaMock.report.update.mockRejectedValue(new Error('Record not found'));

      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should search by name', async () => {
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

      const result = await repository.search('user-123', 'earnings');

      expect(result).toHaveLength(1);
      expect(prismaMock.report.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
          OR: [
            { name: { contains: 'earnings', mode: 'insensitive' } },
            { content: { contains: 'earnings', mode: 'insensitive' } },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should search by content', async () => {
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

      expect(result).toHaveLength(1);
    });

    it('should only search current user reports', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      await repository.search('user-123', 'test');

      expect(prismaMock.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        }),
      );
    });

    it('should exclude deleted reports', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      await repository.search('user-123', 'test');

      expect(prismaMock.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should return empty array when no matches', async () => {
      prismaMock.report.findMany.mockResolvedValue([]);

      const result = await repository.search('user-123', 'nonexistent');

      expect(result).toEqual([]);
    });
  });
});
