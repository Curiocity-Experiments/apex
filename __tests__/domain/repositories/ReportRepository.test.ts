/**
 * ReportRepository Interface Tests
 *
 * Testing the ReportRepository interface contract.
 * Reference: docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { ReportRepository } from '@/domain/repositories/ReportRepository';
import { Report } from '@/domain/entities/Report';
import { createMockReport } from '@/__tests__/utils/factories';

/**
 * Mock implementation for testing the interface contract
 */
class MockReportRepository implements ReportRepository {
  private reports: Map<string, Report> = new Map();

  async findById(id: string): Promise<Report | null> {
    return this.reports.get(id) || null;
  }

  async findByUserId(
    userId: string,
    includeDeleted?: boolean,
  ): Promise<Report[]> {
    const reports = Array.from(this.reports.values()).filter(
      (r) => r.userId === userId,
    );
    if (includeDeleted) {
      return reports;
    }
    return reports.filter((r) => r.deletedAt === null);
  }

  async save(report: Report): Promise<Report> {
    this.reports.set(report.id, { ...report });
    return { ...report };
  }

  async delete(id: string): Promise<void> {
    const report = this.reports.get(id);
    if (report) {
      report.deletedAt = new Date();
      report.updatedAt = new Date();
    }
  }

  async search(userId: string, query: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter((r) => r.userId === userId && r.deletedAt === null)
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.content.toLowerCase().includes(query.toLowerCase()),
      );
  }

  // Helper for testing
  clear() {
    this.reports.clear();
  }
}

describe('ReportRepository Interface', () => {
  let repository: MockReportRepository;

  beforeEach(() => {
    repository = new MockReportRepository();
  });

  describe('findById', () => {
    it('should return a report by id', async () => {
      const report = createMockReport({ id: 'report-123' });
      await repository.save(report);

      const found = await repository.findById('report-123');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('report-123');
    });

    it('should return null if report not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });

    it('should return deleted reports', async () => {
      const report = createMockReport({
        id: 'report-123',
        deletedAt: new Date(),
      });
      await repository.save(report);

      const found = await repository.findById('report-123');

      expect(found).not.toBeNull();
      expect(found?.deletedAt).not.toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return all active reports for a user', async () => {
      await repository.save(
        createMockReport({ id: 'r1', userId: 'user-123', name: 'Report 1' }),
      );
      await repository.save(
        createMockReport({ id: 'r2', userId: 'user-123', name: 'Report 2' }),
      );
      await repository.save(
        createMockReport({ id: 'r3', userId: 'user-456', name: 'Report 3' }),
      );

      const reports = await repository.findByUserId('user-123');

      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.name)).toContain('Report 1');
      expect(reports.map((r) => r.name)).toContain('Report 2');
    });

    it('should exclude deleted reports by default', async () => {
      await repository.save(
        createMockReport({ id: 'r1', userId: 'user-123', name: 'Active' }),
      );
      await repository.save(
        createMockReport({
          id: 'r2',
          userId: 'user-123',
          name: 'Deleted',
          deletedAt: new Date(),
        }),
      );

      const reports = await repository.findByUserId('user-123');

      expect(reports).toHaveLength(1);
      expect(reports[0].name).toBe('Active');
    });

    it('should include deleted reports when requested', async () => {
      await repository.save(
        createMockReport({ id: 'r1', userId: 'user-123', name: 'Active' }),
      );
      await repository.save(
        createMockReport({
          id: 'r2',
          userId: 'user-123',
          name: 'Deleted',
          deletedAt: new Date(),
        }),
      );

      const reports = await repository.findByUserId('user-123', true);

      expect(reports).toHaveLength(2);
    });

    it('should return empty array if user has no reports', async () => {
      const reports = await repository.findByUserId('nonexistent-user');

      expect(reports).toEqual([]);
    });
  });

  describe('save', () => {
    it('should save a new report', async () => {
      const report = createMockReport({ id: 'new-report' });

      const saved = await repository.save(report);

      expect(saved.id).toBe('new-report');

      const found = await repository.findById('new-report');
      expect(found).not.toBeNull();
    });

    it('should update an existing report', async () => {
      const original = createMockReport({
        id: 'report-123',
        name: 'Original Name',
      });
      await repository.save(original);

      const updated = { ...original, name: 'Updated Name' };
      await repository.save(updated);

      const found = await repository.findById('report-123');
      expect(found?.name).toBe('Updated Name');
    });

    it('should return a copy of the saved report', async () => {
      const report = createMockReport({ id: 'report-123' });

      const saved = await repository.save(report);

      // Should not be the same object reference
      expect(saved).not.toBe(report);
      expect(saved).toEqual(report);
    });
  });

  describe('delete', () => {
    it('should soft delete a report', async () => {
      const report = createMockReport({ id: 'report-123' });
      await repository.save(report);

      await repository.delete('report-123');

      const found = await repository.findById('report-123');
      expect(found?.deletedAt).not.toBeNull();
    });

    it('should not throw if report does not exist', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repository.save(
        createMockReport({
          id: 'r1',
          userId: 'user-123',
          name: 'Q4 Earnings Report',
          content: '# Financial Analysis\n\nRevenue increased by 25%',
        }),
      );
      await repository.save(
        createMockReport({
          id: 'r2',
          userId: 'user-123',
          name: 'Market Research',
          content: '# Market Trends\n\nGrowth in tech sector',
        }),
      );
      await repository.save(
        createMockReport({
          id: 'r3',
          userId: 'user-456',
          name: 'Q4 Summary',
          content: 'Different user report',
        }),
      );
    });

    it('should search reports by name', async () => {
      const results = await repository.search('user-123', 'earnings');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Q4 Earnings Report');
    });

    it('should search reports by content', async () => {
      const results = await repository.search('user-123', 'revenue');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('Revenue');
    });

    it('should be case insensitive', async () => {
      const results = await repository.search('user-123', 'EARNINGS');

      expect(results).toHaveLength(1);
    });

    it('should only search current user reports', async () => {
      const results = await repository.search('user-123', 'Q4');

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe('user-123');
    });

    it('should exclude deleted reports from search', async () => {
      await repository.delete('r1');

      const results = await repository.search('user-123', 'earnings');

      expect(results).toHaveLength(0);
    });

    it('should return empty array if no matches', async () => {
      const results = await repository.search('user-123', 'nonexistent');

      expect(results).toEqual([]);
    });
  });
});
