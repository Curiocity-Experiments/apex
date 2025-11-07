/**
 * ReportService Tests
 *
 * IMPORTANT: These tests focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how repository is called).
 *
 * @see docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 * @see docs/TDD-GUIDE.md - Section 3 (Service Layer Testing)
 */

import { ReportService } from '@/services/ReportService';
import { ReportRepository } from '@/domain/repositories/ReportRepository';
import { Report } from '@/domain/entities/Report';

describe('ReportService', () => {
  let service: ReportService;
  let mockRepository: jest.Mocked<ReportRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    };

    service = new ReportService(mockRepository);
  });

  describe('createReport', () => {
    it('should create a report with valid name', async () => {
      const userId = 'user-123';
      const name = 'Q4 2024 Earnings Report';

      // Mock repository to return the saved report
      mockRepository.save.mockImplementation(async (report) => report);

      const result = await service.createReport(userId, name);

      // ✅ Test BEHAVIOR: verify correct data is returned
      expect(result.userId).toBe(userId);
      expect(result.name).toBe(name);
      expect(result.content).toBe('');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });

    it('should trim whitespace from report name', async () => {
      const userId = 'user-123';
      const name = '  Report with spaces  ';

      mockRepository.save.mockImplementation(async (report) => report);

      const result = await service.createReport(userId, name);

      // ✅ Test BEHAVIOR: name should be trimmed
      expect(result.name).toBe('Report with spaces');
    });

    it('should throw error for empty name', async () => {
      const userId = 'user-123';
      const name = '';

      // ✅ Test BEHAVIOR: should reject empty names
      await expect(service.createReport(userId, name)).rejects.toThrow(
        'Report name cannot be empty',
      );
    });

    it('should throw error for whitespace-only name', async () => {
      const userId = 'user-123';
      const name = '   ';

      await expect(service.createReport(userId, name)).rejects.toThrow(
        'Report name cannot be empty',
      );
    });

    it('should throw error for name exceeding 200 characters', async () => {
      const userId = 'user-123';
      const name = 'a'.repeat(201);

      await expect(service.createReport(userId, name)).rejects.toThrow(
        'Report name too long (max 200 characters)',
      );
    });
  });

  describe('getReport', () => {
    it('should return report when user is authorized', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const mockReport: Report = {
        id: reportId,
        userId: userId,
        name: 'Test Report',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(mockReport);

      const result = await service.getReport(reportId, userId);

      // ✅ Test BEHAVIOR: should return the report
      expect(result).toEqual(mockReport);
      expect(result.id).toBe(reportId);
      expect(result.userId).toBe(userId);
    });

    it('should throw error when report not found', async () => {
      const reportId = 'nonexistent';
      const userId = 'user-123';

      mockRepository.findById.mockResolvedValue(null);

      // ✅ Test BEHAVIOR: should reject when not found
      await expect(service.getReport(reportId, userId)).rejects.toThrow(
        'Report not found',
      );
    });

    it('should throw error when user is not the owner', async () => {
      const reportId = 'report-123';
      const ownerId = 'owner-123';
      const requesterId = 'other-user-456';

      const mockReport: Report = {
        id: reportId,
        userId: ownerId,
        name: 'Private Report',
        content: 'Secret content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(mockReport);

      // ✅ Test BEHAVIOR: should reject unauthorized access
      await expect(service.getReport(reportId, requesterId)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should return deleted reports if they exist', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';
      const deletedAt = new Date();

      const mockReport: Report = {
        id: reportId,
        userId: userId,
        name: 'Deleted Report',
        content: 'Content',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: deletedAt,
      };

      mockRepository.findById.mockResolvedValue(mockReport);

      const result = await service.getReport(reportId, userId);

      // ✅ Test BEHAVIOR: deleted reports can still be retrieved by owner
      expect(result).toEqual(mockReport);
      expect(result.deletedAt).toEqual(deletedAt);
    });
  });

  describe('listReports', () => {
    it('should return all reports for a user', async () => {
      const userId = 'user-123';

      const mockReports: Report[] = [
        {
          id: 'report-1',
          userId,
          name: 'Report 1',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'report-2',
          userId,
          name: 'Report 2',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(mockReports);

      const result = await service.listReports(userId);

      // ✅ Test BEHAVIOR: should return all user reports
      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no reports', async () => {
      const userId = 'user-123';

      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.listReports(userId);

      // ✅ Test BEHAVIOR: empty array for no reports
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateReport', () => {
    it('should update report name', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';
      const newName = 'Updated Report Name';

      const existingReport: Report = {
        id: reportId,
        userId,
        name: 'Old Name',
        content: 'Content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);
      mockRepository.save.mockImplementation(async (report) => report);

      const result = await service.updateReport(reportId, userId, {
        name: newName,
      });

      // ✅ Test BEHAVIOR: name should be updated
      expect(result.name).toBe(newName);
      expect(result.id).toBe(reportId);
      expect(result.updatedAt).toBeDefined();
    });

    it('should update report content', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';
      const newContent = '# Updated Content\n\nNew markdown content';

      const existingReport: Report = {
        id: reportId,
        userId,
        name: 'Report',
        content: 'Old content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);
      mockRepository.save.mockImplementation(async (report) => report);

      const result = await service.updateReport(reportId, userId, {
        content: newContent,
      });

      // ✅ Test BEHAVIOR: content should be updated
      expect(result.content).toBe(newContent);
      expect(result.id).toBe(reportId);
    });

    it('should update both name and content', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const existingReport: Report = {
        id: reportId,
        userId,
        name: 'Old Name',
        content: 'Old content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);
      mockRepository.save.mockImplementation(async (report) => report);

      const result = await service.updateReport(reportId, userId, {
        name: 'New Name',
        content: 'New content',
      });

      // ✅ Test BEHAVIOR: both fields updated
      expect(result.name).toBe('New Name');
      expect(result.content).toBe('New content');
    });

    it('should throw error when report not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateReport('nonexistent', 'user-123', { name: 'New Name' }),
      ).rejects.toThrow('Report not found');
    });

    it('should throw error when user is not the owner', async () => {
      const existingReport: Report = {
        id: 'report-123',
        userId: 'owner-123',
        name: 'Report',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);

      await expect(
        service.updateReport('report-123', 'other-user', { name: 'New Name' }),
      ).rejects.toThrow('Unauthorized');
    });

    it('should validate name when updating', async () => {
      const existingReport: Report = {
        id: 'report-123',
        userId: 'user-123',
        name: 'Report',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);

      // Empty name
      await expect(
        service.updateReport('report-123', 'user-123', { name: '' }),
      ).rejects.toThrow('Report name cannot be empty');

      // Name too long
      await expect(
        service.updateReport('report-123', 'user-123', {
          name: 'a'.repeat(201),
        }),
      ).rejects.toThrow('Report name too long');
    });
  });

  describe('deleteReport', () => {
    it('should delete report when user is authorized', async () => {
      const reportId = 'report-123';
      const userId = 'user-123';

      const existingReport: Report = {
        id: reportId,
        userId,
        name: 'Report to Delete',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);
      mockRepository.delete.mockResolvedValue();

      // ✅ Test BEHAVIOR: should complete without error
      await expect(
        service.deleteReport(reportId, userId),
      ).resolves.not.toThrow();
    });

    it('should throw error when report not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteReport('nonexistent', 'user-123'),
      ).rejects.toThrow('Report not found');
    });

    it('should throw error when user is not the owner', async () => {
      const existingReport: Report = {
        id: 'report-123',
        userId: 'owner-123',
        name: 'Report',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findById.mockResolvedValue(existingReport);

      await expect(
        service.deleteReport('report-123', 'other-user'),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('searchReports', () => {
    it('should search reports by query', async () => {
      const userId = 'user-123';
      const query = 'earnings';

      const mockReports: Report[] = [
        {
          id: 'report-1',
          userId,
          name: 'Q4 Earnings Report',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'report-2',
          userId,
          name: 'Annual Earnings Analysis',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockRepository.search.mockResolvedValue(mockReports);

      const result = await service.searchReports(userId, query);

      // ✅ Test BEHAVIOR: should return matching reports
      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      const userId = 'user-123';
      const query = 'nonexistent';

      mockRepository.search.mockResolvedValue([]);

      const result = await service.searchReports(userId, query);

      // ✅ Test BEHAVIOR: empty array for no matches
      expect(result).toEqual([]);
    });
  });
});
