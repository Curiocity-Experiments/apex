/**
 * Test data factories for Apex
 * Reference: docs/TDD-GUIDE.md
 */

import { Report } from '@/domain/entities/Report';
import { Document } from '@/domain/entities/Document';

// ============================================================================
// Report Factory
// ============================================================================

export const createMockReport = (overrides?: Partial<Report>): Report => {
  const baseReport: Report = {
    id: overrides?.id || crypto.randomUUID(),
    userId: overrides?.userId || 'user-123',
    name: overrides?.name || 'Test Report',
    content: overrides?.content || '',
    createdAt: overrides?.createdAt || new Date('2025-01-01T00:00:00Z'),
    updatedAt: overrides?.updatedAt || new Date('2025-01-01T00:00:00Z'),
    deletedAt: overrides?.deletedAt !== undefined ? overrides.deletedAt : null,
  };

  return { ...baseReport, ...overrides };
};

/**
 * Builder pattern for complex report objects
 *
 * @example
 * const report = new ReportBuilder()
 *   .withName('Q4 Earnings')
 *   .withUserId('user-456')
 *   .withContent('# Q4 Analysis\n\n...')
 *   .build();
 */
export class ReportBuilder {
  private report: Partial<Report> = {};

  withId(id: string) {
    this.report.id = id;
    return this;
  }

  withUserId(userId: string) {
    this.report.userId = userId;
    return this;
  }

  withName(name: string) {
    this.report.name = name;
    return this;
  }

  withContent(content: string) {
    this.report.content = content;
    return this;
  }

  deleted(deletedAt: Date = new Date()) {
    this.report.deletedAt = deletedAt;
    return this;
  }

  createdAt(date: Date) {
    this.report.createdAt = date;
    return this;
  }

  updatedAt(date: Date) {
    this.report.updatedAt = date;
    return this;
  }

  build(): Report {
    return createMockReport(this.report);
  }
}

// ============================================================================
// Document Factory
// ============================================================================

export const createMockDocument = (overrides?: Partial<Document>): Document => {
  const baseDocument: Document = {
    id: overrides?.id || crypto.randomUUID(),
    reportId: overrides?.reportId || 'report-123',
    filename: overrides?.filename || 'test-document.txt',
    fileHash: overrides?.fileHash || 'abc123def456',
    storagePath: overrides?.storagePath || '/storage/test-document.txt',
    parsedContent:
      overrides?.parsedContent !== undefined
        ? overrides.parsedContent
        : 'Parsed content',
    notes: overrides?.notes || '',
    createdAt: overrides?.createdAt || new Date('2025-01-01T00:00:00Z'),
    updatedAt: overrides?.updatedAt || new Date('2025-01-01T00:00:00Z'),
    deletedAt: overrides?.deletedAt !== undefined ? overrides.deletedAt : null,
  };

  return { ...baseDocument, ...overrides };
};

/**
 * Builder pattern for complex document objects
 *
 * @example
 * const doc = new DocumentBuilder()
 *   .withFilename('earnings-report.pdf')
 *   .withParsedContent('Earnings increased by 25%')
 *   .withNotes('Important document')
 *   .build();
 */
export class DocumentBuilder {
  private document: Partial<Document> = {};

  withId(id: string) {
    this.document.id = id;
    return this;
  }

  withReportId(reportId: string) {
    this.document.reportId = reportId;
    return this;
  }

  withFilename(filename: string) {
    this.document.filename = filename;
    return this;
  }

  withFileHash(fileHash: string) {
    this.document.fileHash = fileHash;
    return this;
  }

  withStoragePath(storagePath: string) {
    this.document.storagePath = storagePath;
    return this;
  }

  withParsedContent(parsedContent: string | null) {
    this.document.parsedContent = parsedContent;
    return this;
  }

  withNotes(notes: string) {
    this.document.notes = notes;
    return this;
  }

  deleted(deletedAt: Date = new Date()) {
    this.document.deletedAt = deletedAt;
    return this;
  }

  createdAt(date: Date) {
    this.document.createdAt = date;
    return this;
  }

  updatedAt(date: Date) {
    this.document.updatedAt = date;
    return this;
  }

  build(): Document {
    return createMockDocument(this.document);
  }
}

// ============================================================================
// User Factory
// ============================================================================

export interface MockUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockUser = (overrides?: Partial<MockUser>): MockUser => {
  return {
    id: overrides?.id || 'user-123',
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    createdAt: overrides?.createdAt || new Date('2025-01-01T00:00:00Z'),
    updatedAt: overrides?.updatedAt || new Date('2025-01-01T00:00:00Z'),
  };
};

// ============================================================================
// Batch Factories (for list/array tests)
// ============================================================================

/**
 * Create multiple mock reports
 *
 * @example
 * const reports = createMockReports(5); // Creates 5 reports
 * const reports = createMockReports(3, { userId: 'user-456' }); // 3 reports for user-456
 */
export const createMockReports = (
  count: number,
  overrides?: Partial<Report>,
): Report[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockReport({
      ...overrides,
      id: overrides?.id || `report-${i + 1}`,
      name: overrides?.name || `Report ${i + 1}`,
    }),
  );
};

/**
 * Create multiple mock documents
 */
export const createMockDocuments = (
  count: number,
  overrides?: Partial<Document>,
): Document[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockDocument({
      ...overrides,
      id: overrides?.id || `document-${i + 1}`,
      filename: overrides?.filename || `document-${i + 1}.txt`,
    }),
  );
};

// ============================================================================
// Realistic Data Generators
// ============================================================================

/**
 * Generate realistic report names
 */
export const generateReportName = (
  type?: 'earnings' | 'analysis' | 'research',
): string => {
  const types = {
    earnings: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual', 'Monthly'],
    analysis: ['Market', 'Competitor', 'Industry', 'Trend', 'Risk'],
    research: ['Deep Dive', 'Overview', 'Summary', 'Investigation'],
  };

  const selectedType = type || 'earnings';
  const prefix =
    types[selectedType][Math.floor(Math.random() * types[selectedType].length)];
  const year = 2024 + Math.floor(Math.random() * 2);

  return `${prefix} ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} ${year}`;
};

/**
 * Generate realistic document filenames
 */
export const generateFilename = (
  extension: 'txt' | 'md' | 'pdf' = 'txt',
): string => {
  const prefixes = ['earnings', 'financials', 'report', 'analysis', 'summary'];
  const dates = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const date = dates[Math.floor(Math.random() * dates.length)];

  return `${prefix}-${date}.${extension}`;
};
