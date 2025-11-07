/**
 * ReportService
 *
 * Business logic for Report operations including CRUD and authorization.
 * This service enforces business rules and delegates data access to the repository.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 2: Business Logic
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 4.3 (Service Layer)
 */

import { Report } from '@/domain/entities/Report';
import { ReportRepository } from '@/domain/repositories/ReportRepository';

export class ReportService {
  constructor(private reportRepository: ReportRepository) {}

  /**
   * Create a new report
   * @param userId - Owner of the report
   * @param name - Report name (will be trimmed and validated)
   * @returns Created report
   * @throws Error if name is invalid
   */
  async createReport(userId: string, name: string): Promise<Report> {
    // Validate and normalize name
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('Report name cannot be empty');
    }

    if (trimmedName.length > 200) {
      throw new Error('Report name too long (max 200 characters)');
    }

    // Create report entity
    const report: Report = {
      id: crypto.randomUUID(),
      userId,
      name: trimmedName,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // Save to repository
    return await this.reportRepository.save(report);
  }

  /**
   * Get a report by ID with authorization check
   * @param id - Report ID
   * @param userId - User requesting the report (must be owner)
   * @returns Report if found and authorized
   * @throws Error if not found or unauthorized
   */
  async getReport(id: string, userId: string): Promise<Report> {
    const report = await this.reportRepository.findById(id);

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return report;
  }

  /**
   * List all reports for a user
   * @param userId - User ID
   * @returns Array of reports (excluding deleted reports by default)
   */
  async listReports(userId: string): Promise<Report[]> {
    return await this.reportRepository.findByUserId(userId);
  }

  /**
   * Update a report
   * @param id - Report ID
   * @param userId - User requesting the update (must be owner)
   * @param updates - Fields to update (name and/or content)
   * @returns Updated report
   * @throws Error if not found, unauthorized, or validation fails
   */
  async updateReport(
    id: string,
    userId: string,
    updates: { name?: string; content?: string },
  ): Promise<Report> {
    // Get existing report with authorization check
    const report = await this.getReport(id, userId);

    // Validate and apply name update if provided
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();

      if (!trimmedName) {
        throw new Error('Report name cannot be empty');
      }

      if (trimmedName.length > 200) {
        throw new Error('Report name too long (max 200 characters)');
      }

      report.name = trimmedName;
    }

    // Apply content update if provided
    if (updates.content !== undefined) {
      report.content = updates.content;
    }

    // Update timestamp
    report.updatedAt = new Date();

    // Save and return
    return await this.reportRepository.save(report);
  }

  /**
   * Delete a report (soft delete)
   * @param id - Report ID
   * @param userId - User requesting deletion (must be owner)
   * @throws Error if not found or unauthorized
   */
  async deleteReport(id: string, userId: string): Promise<void> {
    // Get existing report with authorization check
    const report = await this.getReport(id, userId);

    // Soft delete
    await this.reportRepository.delete(report.id);
  }

  /**
   * Search reports by name or content
   * @param userId - User ID
   * @param query - Search query string
   * @returns Array of matching reports
   */
  async searchReports(userId: string, query: string): Promise<Report[]> {
    return await this.reportRepository.search(userId, query);
  }
}
