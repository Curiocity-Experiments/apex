/**
 * ReportRepository Interface
 *
 * Defines the contract for Report data access.
 * Implementations (PrismaReportRepository, InMemoryReportRepository) must follow this interface.
 *
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 4.2 (Repository Pattern)
 * @see __tests__/domain/repositories/ReportRepository.test.ts - Interface contract tests
 */

import { Report } from '@/domain/entities/Report';

export interface ReportRepository {
  /**
   * Find a report by its unique ID
   * @param id - Report UUID
   * @returns Report if found, null otherwise
   */
  findById(id: string): Promise<Report | null>;

  /**
   * Find all reports belonging to a user
   * @param userId - User UUID
   * @param includeDeleted - Whether to include soft-deleted reports (default: false)
   * @returns Array of reports (empty if none found)
   */
  findByUserId(userId: string, includeDeleted?: boolean): Promise<Report[]>;

  /**
   * Save (create or update) a report
   * @param report - Report to save
   * @returns Saved report (with any database-generated fields)
   */
  save(report: Report): Promise<Report>;

  /**
   * Soft delete a report
   * Sets deletedAt to current timestamp
   * @param id - Report UUID to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Search reports by name or content
   * Only searches active (non-deleted) reports for the specified user
   * @param userId - User UUID
   * @param query - Search query string (case-insensitive)
   * @returns Array of matching reports
   */
  search(userId: string, query: string): Promise<Report[]>;
}
