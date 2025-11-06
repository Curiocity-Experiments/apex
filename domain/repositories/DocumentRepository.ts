/**
 * DocumentRepository Interface
 *
 * Defines the contract for Document data access.
 * Implementations (PrismaDocumentRepository, InMemoryDocumentRepository) must follow this interface.
 *
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 4.2 (Repository Pattern)
 * @see __tests__/domain/repositories/DocumentRepository.test.ts - Interface contract tests
 */

import { Document } from '@/domain/entities/Document';

export interface DocumentRepository {
  /**
   * Find a document by its unique ID
   * @param id - Document UUID
   * @returns Document if found, null otherwise
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Find all documents belonging to a report
   * @param reportId - Report UUID
   * @param includeDeleted - Whether to include soft-deleted documents (default: false)
   * @returns Array of documents (empty if none found)
   */
  findByReportId(
    reportId: string,
    includeDeleted?: boolean,
  ): Promise<Document[]>;

  /**
   * Find a document by its file hash within a report
   * Used for deduplication - checking if file already exists before upload
   * @param reportId - Report UUID to search within
   * @param fileHash - SHA-256 hash of file content
   * @returns Document if found, null otherwise
   */
  findByHash(reportId: string, fileHash: string): Promise<Document | null>;

  /**
   * Save (create or update) a document
   * @param document - Document to save
   * @returns Saved document (with any database-generated fields)
   */
  save(document: Document): Promise<Document>;

  /**
   * Soft delete a document
   * Sets deletedAt to current timestamp
   * @param id - Document UUID to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Search documents by filename, notes, or parsed content
   * Only searches active (non-deleted) documents within the specified report
   * @param reportId - Report UUID to search within
   * @param query - Search query string (case-insensitive)
   * @returns Array of matching documents
   */
  search(reportId: string, query: string): Promise<Document[]>;
}
