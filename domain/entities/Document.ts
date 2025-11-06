/**
 * Document Domain Entity
 *
 * Represents a file/document attached to a report.
 * Documents can be parsed into markdown and deduplicated by file hash.
 *
 * @see prisma/schema.prisma - Document model
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 3.2.2
 */

export interface Document {
  /**
   * Unique identifier (UUID)
   */
  id: string;

  /**
   * Parent report (foreign key to Report)
   */
  reportId: string;

  /**
   * Original filename
   * @example "Q4-earnings-2024.pdf"
   */
  filename: string;

  /**
   * SHA-256 hash of file content
   * Used for deduplication - prevents storing same file twice
   * @example "a3b2c1d4e5f6..."
   */
  fileHash: string;

  /**
   * Path to file in storage system
   * @example "/storage/2025/01/15/abc123.pdf"
   */
  storagePath: string;

  /**
   * Parsed content in markdown format
   * null = not yet parsed or parsing failed
   * string = successfully parsed content
   */
  parsedContent: string | null;

  /**
   * User notes about this document
   * Defaults to empty string
   */
  notes: string;

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
   * null = active document
   * Date = deleted document (can be restored)
   */
  deletedAt: Date | null;
}

/**
 * Type guard to check if a document is deleted
 */
export function isDocumentDeleted(document: Document): boolean {
  return document.deletedAt !== null;
}

/**
 * Type guard to check if a document is active
 */
export function isDocumentActive(document: Document): boolean {
  return document.deletedAt === null;
}

/**
 * Type guard to check if a document has been parsed
 */
export function hasBeenParsed(document: Document): boolean {
  return document.parsedContent !== null && document.parsedContent !== '';
}
