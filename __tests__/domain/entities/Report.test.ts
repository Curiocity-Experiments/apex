/**
 * Report Entity Tests
 *
 * Testing the Report domain entity following TDD principles.
 * Reference: docs/TDD-GUIDE.md Section 3.1 (Domain Layer Testing)
 */

import {
  Report,
  isReportDeleted,
  isReportActive,
} from '@/domain/entities/Report';

describe('Report Entity', () => {
  describe('Creation', () => {
    it('should create a valid report with all required fields', () => {
      const report: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Q4 Earnings Report',
        content: '# Q4 Analysis\n\nRevenue up 25%',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      expect(report.id).toBe('report-123');
      expect(report.userId).toBe('user-456');
      expect(report.name).toBe('Q4 Earnings Report');
      expect(report.content).toBe('# Q4 Analysis\n\nRevenue up 25%');
      expect(report.deletedAt).toBeNull();
    });

    it('should create a report with empty content', () => {
      const report: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Empty Report',
        content: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      expect(report.content).toBe('');
    });

    it('should create a soft-deleted report', () => {
      const deletedAt = new Date('2025-01-15T00:00:00Z');
      const report: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Deleted Report',
        content: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt,
      };

      expect(report.deletedAt).toEqual(deletedAt);
    });
  });

  describe('Type Safety', () => {
    it('should enforce required fields', () => {
      // TypeScript should prevent creating a Report without required fields
      // This is a compile-time check, but we can verify the type structure exists
      const report: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Test',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // All required fields must be present
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('userId');
      expect(report).toHaveProperty('name');
      expect(report).toHaveProperty('content');
      expect(report).toHaveProperty('createdAt');
      expect(report).toHaveProperty('updatedAt');
      expect(report).toHaveProperty('deletedAt');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all data when cloned', () => {
      const original: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Original Report',
        content: 'Original content',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
        deletedAt: null,
      };

      const cloned = { ...original };

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference
    });

    it('should allow partial updates', () => {
      const report: Report = {
        id: 'report-123',
        userId: 'user-456',
        name: 'Original Name',
        content: 'Original content',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      const updated: Report = {
        ...report,
        name: 'Updated Name',
        content: 'Updated content',
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      };

      expect(updated.name).toBe('Updated Name');
      expect(updated.content).toBe('Updated content');
      expect(updated.id).toBe(report.id); // ID unchanged
      expect(updated.userId).toBe(report.userId); // User ID unchanged
    });
  });

  describe('Soft Delete Behavior', () => {
    it('should distinguish between active and deleted reports', () => {
      const activeReport: Report = {
        id: 'report-1',
        userId: 'user-456',
        name: 'Active Report',
        content: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      const deletedReport: Report = {
        id: 'report-2',
        userId: 'user-456',
        name: 'Deleted Report',
        content: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: new Date('2025-01-15T00:00:00Z'),
      };

      // Active report has null deletedAt
      expect(activeReport.deletedAt).toBeNull();

      // Deleted report has a Date value
      expect(deletedReport.deletedAt).toBeInstanceOf(Date);
      expect(deletedReport.deletedAt).not.toBeNull();
    });
  });

  describe('Helper Functions', () => {
    describe('isReportDeleted', () => {
      it('should return false for active reports', () => {
        const report: Report = {
          id: 'report-123',
          userId: 'user-456',
          name: 'Active Report',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(isReportDeleted(report)).toBe(false);
      });

      it('should return true for deleted reports', () => {
        const report: Report = {
          id: 'report-123',
          userId: 'user-456',
          name: 'Deleted Report',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date('2025-01-15T00:00:00Z'),
        };

        expect(isReportDeleted(report)).toBe(true);
      });
    });

    describe('isReportActive', () => {
      it('should return true for active reports', () => {
        const report: Report = {
          id: 'report-123',
          userId: 'user-456',
          name: 'Active Report',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(isReportActive(report)).toBe(true);
      });

      it('should return false for deleted reports', () => {
        const report: Report = {
          id: 'report-123',
          userId: 'user-456',
          name: 'Deleted Report',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date('2025-01-15T00:00:00Z'),
        };

        expect(isReportActive(report)).toBe(false);
      });
    });
  });
});
