/**
 * DocumentService Tests
 *
 * IMPORTANT: These tests focus on BEHAVIOR (documents are created/managed correctly),
 * not IMPLEMENTATION (how dependencies are called).
 *
 * @see docs/TDD-GUIDE.md - Section 3 (Service Layer Testing)
 */

// Mock crypto BEFORE imports
jest.mock('crypto', () => ({
  randomUUID: () => 'doc-uuid-123',
  createHash: () => ({
    update: () => ({
      digest: () => 'abc123def456789',
    }),
  }),
}));

import { DocumentService } from '@/services/DocumentService';
import { DocumentRepository } from '@/domain/repositories/DocumentRepository';
import { FileStorageService } from '@/services/FileStorageService';
import { ParserService } from '@/services/ParserService';
import { Document } from '@/domain/entities/Document';

describe('DocumentService', () => {
  let service: DocumentService;
  let mockDocumentRepo: jest.Mocked<DocumentRepository>;
  let mockStorageService: jest.Mocked<FileStorageService>;
  let mockParserService: jest.Mocked<ParserService>;

  beforeEach(() => {
    // Create mocks
    mockDocumentRepo = {
      findById: jest.fn(),
      findByReportId: jest.fn(),
      findByHash: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    };

    mockStorageService = {
      saveFile: jest.fn(),
      getFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
    } as any;

    mockParserService = {
      parse: jest.fn(),
    } as any;

    service = new DocumentService(
      mockDocumentRepo,
      mockStorageService,
      mockParserService,
    );
  });

  describe('uploadDocument', () => {
    it('should upload document with all steps', async () => {
      const reportId = 'report-123';
      const filename = 'test.pdf';
      const fileBuffer = Buffer.from('PDF content');

      mockDocumentRepo.findByHash.mockResolvedValue(null);
      mockStorageService.saveFile.mockResolvedValue(
        '/storage/report-123/abc123.pdf',
      );
      mockParserService.parse.mockResolvedValue('Parsed text content');
      mockDocumentRepo.save.mockImplementation(async (doc) => doc);

      const result = await service.uploadDocument(
        reportId,
        fileBuffer,
        filename,
      );

      // ✅ Test BEHAVIOR: document created with all data
      expect(result.reportId).toBe(reportId);
      expect(result.filename).toBe(filename);
      expect(result.fileHash).toBe('abc123def456789');
      expect(result.storagePath).toBe('/storage/report-123/abc123.pdf');
      expect(result.parsedContent).toBe('Parsed text content');
    });

    it('should throw error for duplicate file', async () => {
      const reportId = 'report-123';
      const filename = 'test.pdf';
      const fileBuffer = Buffer.from('PDF content');

      const existingDoc: Document = {
        id: 'doc-123',
        reportId,
        filename,
        fileHash: 'abc123def456789',
        storagePath: '/storage/report-123/abc123.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDocumentRepo.findByHash.mockResolvedValue(existingDoc);

      // ✅ Test BEHAVIOR: duplicates are rejected
      await expect(
        service.uploadDocument(reportId, fileBuffer, filename),
      ).rejects.toThrow('Document already exists');
    });

    it('should handle parsing failure gracefully', async () => {
      const reportId = 'report-123';
      const filename = 'test.pdf';
      const fileBuffer = Buffer.from('PDF content');

      mockDocumentRepo.findByHash.mockResolvedValue(null);
      mockStorageService.saveFile.mockResolvedValue(
        '/storage/report-123/abc123.pdf',
      );
      mockParserService.parse.mockRejectedValue(new Error('Parsing failed'));
      mockDocumentRepo.save.mockImplementation(async (doc) => doc);

      const result = await service.uploadDocument(
        reportId,
        fileBuffer,
        filename,
      );

      // ✅ Test BEHAVIOR: document created even if parsing fails
      expect(result.parsedContent).toBeNull();
      expect(result.storagePath).toBe('/storage/report-123/abc123.pdf');
    });
  });

  describe('getDocument', () => {
    it('should return document when found', async () => {
      const docId = 'doc-123';
      const mockDoc: Document = {
        id: docId,
        reportId: 'report-123',
        filename: 'test.pdf',
        fileHash: 'abc123',
        storagePath: '/storage/test.pdf',
        parsedContent: 'content',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDocumentRepo.findById.mockResolvedValue(mockDoc);

      const result = await service.getDocument(docId);

      // ✅ Test BEHAVIOR: document returned
      expect(result).toEqual(mockDoc);
    });

    it('should throw error when not found', async () => {
      mockDocumentRepo.findById.mockResolvedValue(null);

      await expect(service.getDocument('nonexistent')).rejects.toThrow(
        'Document not found',
      );
    });
  });

  describe('listDocuments', () => {
    it('should return all documents for report', async () => {
      const reportId = 'report-123';
      const mockDocs: Document[] = [
        {
          id: 'doc-1',
          reportId,
          filename: 'file1.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/file1.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'doc-2',
          reportId,
          filename: 'file2.pdf',
          fileHash: 'hash2',
          storagePath: '/storage/file2.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockDocumentRepo.findByReportId.mockResolvedValue(mockDocs);

      const result = await service.listDocuments(reportId);

      // ✅ Test BEHAVIOR: all documents returned
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockDocs);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document and file', async () => {
      const docId = 'doc-123';
      const mockDoc: Document = {
        id: docId,
        reportId: 'report-123',
        filename: 'test.pdf',
        fileHash: 'abc123',
        storagePath: '/storage/test.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDocumentRepo.findById.mockResolvedValue(mockDoc);
      mockStorageService.deleteFile.mockResolvedValue();
      mockDocumentRepo.delete.mockResolvedValue();

      // ✅ Test BEHAVIOR: deletion completes
      await expect(service.deleteDocument(docId)).resolves.not.toThrow();
    });

    it('should throw error when document not found', async () => {
      mockDocumentRepo.findById.mockResolvedValue(null);

      await expect(service.deleteDocument('nonexistent')).rejects.toThrow(
        'Document not found',
      );
    });
  });
});
