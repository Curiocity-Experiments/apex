/**
 * Report Domain Entity
 *
 * Represents a research report containing documents and analysis.
 * Reports are the top-level containers in Apex.
 *
 * @see prisma/schema.prisma - Report model
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 3.2.1
 */

export interface Report {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * Owner of this report (foreign key to User)
   */
  userId: string;

  /**
   * Report display name
   * @example "Q4 2024 Earnings Analysis"
   */
  name: string;

  /**
   * Main content/notes in markdown format
   * Defaults to empty string for new reports
   */
  content: string;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;

  /**
   * Soft delete timestamp
   * null = active report
   * Date = deleted report (can be restored)
   */
  deletedAt: Date | null;
}

/**
 * Type guard to check if a report is deleted
 */
export function isReportDeleted(report: Report): boolean {
  return report.deletedAt !== null;
}

/**
 * Type guard to check if a report is active
 */
export function isReportActive(report: Report): boolean {
  return report.deletedAt === null;
}
