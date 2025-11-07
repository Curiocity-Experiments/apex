/**
 * DocumentService
 *
 * Business logic for Document operations including file upload orchestration.
 * Coordinates FileStorageService, ParserService, and DocumentRepository.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 2: Document Service
 * @see docs/TECHNICAL-SPECIFICATION.md - Section 4.3 (Service Layer)
 */

import { Document } from '@/domain/entities/Document';
import { DocumentRepository } from '@/domain/repositories/DocumentRepository';
import { FileStorageService } from './FileStorageService';
import { ParserService } from './ParserService';
import * as crypto from 'crypto';

export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: FileStorageService,
    private parserService: ParserService,
  ) {}

  /**
   * Upload a new document
   * @param reportId - Report to add document to
   * @param file - File content (Buffer or File object)
   * @param filename - Original filename
   * @returns Created document
   * @throws Error if duplicate file or upload fails
   */
  async uploadDocument(
    reportId: string,
    file: File | Buffer,
    filename: string,
  ): Promise<Document> {
    // Calculate file hash for deduplication
    const fileHash = await this.calculateHash(file);

    // Check for duplicate
    const existing = await this.documentRepository.findByHash(
      reportId,
      fileHash,
    );
    if (existing) {
      throw new Error('Document already exists in this report');
    }

    // Store file
    const storagePath = await this.storageService.saveFile(
      reportId,
      fileHash,
      file,
      filename,
    );

    // Parse content (gracefully handle failures)
    let parsedContent: string | null = null;
    try {
      parsedContent = await this.parserService.parse(file, filename);
      if (!parsedContent) {
        parsedContent = null; // Empty string → null
      }
    } catch (error) {
      console.error('Parsing failed:', error);
      // Continue without parsed content
    }

    // Create document entity
    const document: Document = {
      id: crypto.randomUUID(),
      reportId,
      filename,
      fileHash,
      storagePath,
      parsedContent,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // Save to repository
    return await this.documentRepository.save(document);
  }

  /**
   * Get a document by ID
   * @param id - Document ID
   * @returns Document if found
   * @throws Error if not found
   */
  async getDocument(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  /**
   * List all documents for a report
   * @param reportId - Report ID
   * @returns Array of documents
   */
  async listDocuments(reportId: string): Promise<Document[]> {
    return await this.documentRepository.findByReportId(reportId);
  }

  /**
   * Update document metadata
   * @param id - Document ID
   * @param updates - Fields to update
   * @returns Updated document
   */
  async updateDocument(
    id: string,
    updates: { filename?: string; notes?: string },
  ): Promise<Document> {
    const document = await this.getDocument(id);

    if (updates.filename !== undefined) {
      document.filename = updates.filename;
    }

    if (updates.notes !== undefined) {
      document.notes = updates.notes;
    }

    document.updatedAt = new Date();

    return await this.documentRepository.save(document);
  }

  /**
   * Delete a document (soft delete + remove file)
   * @param id - Document ID
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocument(id);

    // Delete file from storage
    await this.storageService.deleteFile(document.storagePath);

    // Soft delete record
    await this.documentRepository.delete(id);
  }

  /**
   * Search documents by filename or content
   * @param reportId - Report ID to search within
   * @param query - Search query
   * @returns Matching documents
   */
  async searchDocuments(reportId: string, query: string): Promise<Document[]> {
    return await this.documentRepository.search(reportId, query);
  }

  /**
   * Calculate SHA-256 hash of file content
   * @private
   */
  private async calculateHash(file: File | Buffer): Promise<string> {
    const buffer =
      file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
