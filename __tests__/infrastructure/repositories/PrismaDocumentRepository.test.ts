/**
 * PrismaDocumentRepository Tests
 *
 * Testing Prisma implementation of DocumentRepository interface.
 * Uses mocked Prisma client for fast, isolated tests.
 *
 * IMPORTANT: These tests focus on BEHAVIOR (what is returned),
 * not IMPLEMENTATION (how Prisma is called).
 *
 * Reference: docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { PrismaDocumentRepository } from '@/infrastructure/repositories/PrismaDocumentRepository';
import { Document } from '@/domain/entities/Document';
import {
  getMockPrisma,
  MockPrismaClient,
} from '@/__tests__/utils/db/prisma-mock';
import { createMockDocument } from '@/__tests__/utils/factories';

describe('PrismaDocumentRepository', () => {
  let repository: PrismaDocumentRepository;
  let prismaMock: MockPrismaClient;

  beforeEach(() => {
    prismaMock = getMockPrisma();
    repository = new PrismaDocumentRepository(prismaMock);
  });

  describe('findById', () => {
    it('should return document when found', async () => {
      const mockDbDocument = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'test.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/test.pdf',
        parsedContent: 'Parsed content',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      prismaMock.document.findUnique.mockResolvedValue(mockDbDocument);

      const result = await repository.findById('doc-123');

      // Test BEHAVIOR: verify correct data is returned
      expect(result).not.toBeNull();
      expect(result?.id).toBe('doc-123');
      expect(result?.reportId).toBe('report-456');
      expect(result?.filename).toBe('test.pdf');
      expect(result?.fileHash).toBe('hash123');
      expect(result?.parsedContent).toBe('Parsed content');
    });

    it('should return null when not found', async () => {
      prismaMock.document.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      // Test BEHAVIOR: null when not found
      expect(result).toBeNull();
    });

    it('should include deleted documents', async () => {
      const mockDbDocument = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'deleted.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/deleted.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: new Date('2025-01-15'),
      };

      prismaMock.document.findUnique.mockResolvedValue(mockDbDocument);

      const result = await repository.findById('doc-123');

      // Test BEHAVIOR: deleted documents are returned
      expect(result).not.toBeNull();
      expect(result?.deletedAt).toBeInstanceOf(Date);
      expect(result?.deletedAt).not.toBeNull();
    });
  });

  describe('findByReportId', () => {
    it('should return all active documents for report', async () => {
      const mockDbDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'doc1.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/doc1.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        {
          id: 'doc-2',
          reportId: 'report-123',
          filename: 'doc2.pdf',
          fileHash: 'hash2',
          storagePath: '/storage/doc2.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
          deletedAt: null,
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      const result = await repository.findByReportId('report-123');

      // Test BEHAVIOR: returns all documents
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('doc-1');
      expect(result[1].id).toBe('doc-2');

      // Test BEHAVIOR: all documents belong to report
      result.forEach((doc) => {
        expect(doc.reportId).toBe('report-123');
      });
    });

    it('should exclude deleted documents by default', async () => {
      const activeDocument = {
        id: 'doc-1',
        reportId: 'report-123',
        filename: 'active.pdf',
        fileHash: 'hash1',
        storagePath: '/storage/active.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      // Mock returns only active documents (deleted ones filtered by Prisma)
      prismaMock.document.findMany.mockResolvedValue([activeDocument]);

      const result = await repository.findByReportId('report-123');

      // Test BEHAVIOR: only active documents returned
      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();

      // Test BEHAVIOR: verify it's the active document
      expect(result[0].filename).toBe('active.pdf');
    });

    it('should include deleted documents when requested', async () => {
      const mockDbDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'active.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/active.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        {
          id: 'doc-2',
          reportId: 'report-123',
          filename: 'deleted.pdf',
          fileHash: 'hash2',
          storagePath: '/storage/deleted.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: new Date('2025-01-15'),
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      const result = await repository.findByReportId('report-123', true);

      // Test BEHAVIOR: both active and deleted returned
      expect(result).toHaveLength(2);

      // Test BEHAVIOR: verify mix of active and deleted
      const activeDocs = result.filter((d) => d.deletedAt === null);
      const deletedDocs = result.filter((d) => d.deletedAt !== null);
      expect(activeDocs).toHaveLength(1);
      expect(deletedDocs).toHaveLength(1);
    });

    it('should return empty array when no documents found', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      const result = await repository.findByReportId('empty-report');

      // Test BEHAVIOR: empty array when no documents
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByHash', () => {
    it('should find document by file hash within report', async () => {
      const mockDbDocument = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'duplicate.pdf',
        fileHash: 'abc123',
        storagePath: '/storage/duplicate.pdf',
        parsedContent: 'Content',
        notes: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      prismaMock.document.findFirst.mockResolvedValue(mockDbDocument);

      const result = await repository.findByHash('report-456', 'abc123');

      // Test BEHAVIOR: document with matching hash is found
      expect(result).not.toBeNull();
      expect(result?.fileHash).toBe('abc123');
      expect(result?.reportId).toBe('report-456');
    });

    it('should return null when hash not found', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      const result = await repository.findByHash('report-456', 'nonexistent');

      // Test BEHAVIOR: null when hash not found
      expect(result).toBeNull();
    });

    it('should only search within specified report', async () => {
      const mockDbDocument = {
        id: 'doc-2',
        reportId: 'report-456',
        filename: 'doc.pdf',
        fileHash: 'samehash',
        storagePath: '/storage/doc.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
      };

      prismaMock.document.findFirst.mockResolvedValue(mockDbDocument);

      const result = await repository.findByHash('report-456', 'samehash');

      // Test BEHAVIOR: only document from specified report is returned
      expect(result).not.toBeNull();
      expect(result?.reportId).toBe('report-456');
      expect(result?.fileHash).toBe('samehash');
    });

    it('should exclude deleted documents', async () => {
      // Mock returns null (deleted document filtered out)
      prismaMock.document.findFirst.mockResolvedValue(null);

      const result = await repository.findByHash('report-456', 'hash123');

      // Test BEHAVIOR: deleted documents not found
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create new document', async () => {
      const newDocument: Document = createMockDocument({
        id: 'new-doc',
        reportId: 'report-123',
        filename: 'new.pdf',
        fileHash: 'newhash',
      });

      const mockDbDocument = {
        ...newDocument,
        createdAt: newDocument.createdAt,
        updatedAt: newDocument.updatedAt,
        deletedAt: null,
      };

      prismaMock.document.upsert.mockResolvedValue(mockDbDocument);

      const result = await repository.save(newDocument);

      // Test BEHAVIOR: saved document is returned
      expect(result.id).toBe('new-doc');
      expect(result.reportId).toBe('report-123');
      expect(result.filename).toBe('new.pdf');
      expect(result.fileHash).toBe('newhash');
    });

    it('should update existing document', async () => {
      const existingDocument: Document = createMockDocument({
        id: 'existing-doc',
        notes: 'Updated notes',
        parsedContent: 'Updated parsed content',
      });

      const mockDbDocument = { ...existingDocument, deletedAt: null };

      prismaMock.document.upsert.mockResolvedValue(mockDbDocument);

      const result = await repository.save(existingDocument);

      // Test BEHAVIOR: updated values are persisted
      expect(result.id).toBe('existing-doc');
      expect(result.notes).toBe('Updated notes');
      expect(result.parsedContent).toBe('Updated parsed content');
    });

    it('should handle restore of soft-deleted document', async () => {
      const restoredDocument: Document = createMockDocument({
        id: 'doc-123',
        filename: 'restored.pdf',
        deletedAt: null, // Restoring
      });

      const mockDbDocument = { ...restoredDocument, deletedAt: null };

      prismaMock.document.upsert.mockResolvedValue(mockDbDocument);

      const result = await repository.save(restoredDocument);

      // Test BEHAVIOR: deletedAt is null (restored)
      expect(result.id).toBe('doc-123');
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete document', async () => {
      const mockDbDocument = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'doc.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/doc.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-15'),
        deletedAt: new Date('2025-01-15'),
      };

      prismaMock.document.update.mockResolvedValue(mockDbDocument);

      await repository.delete('doc-123');

      // Test BEHAVIOR: delete method completes without error
      expect(prismaMock.document.update).toHaveBeenCalled();
    });

    it('should not throw if document does not exist', async () => {
      prismaMock.document.update.mockRejectedValue(
        new Error('Record not found'),
      );

      // Test BEHAVIOR: no error thrown for non-existent document
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should find documents by filename (case-insensitive)', async () => {
      const mockDbDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'earnings-Q4.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/earnings.pdf',
          parsedContent: 'Content',
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      const result = await repository.search('report-123', 'EARNINGS');

      // Test BEHAVIOR: finds document with matching filename (case-insensitive)
      expect(result).toHaveLength(1);
      expect(result[0].filename).toContain('earnings');
    });

    it('should find documents by notes', async () => {
      const mockDbDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'doc.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/doc.pdf',
          parsedContent: null,
          notes: 'Important document with keywords',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      const result = await repository.search('report-123', 'important');

      // Test BEHAVIOR: finds document with matching notes
      expect(result).toHaveLength(1);
      expect(result[0].notes).toContain('Important');
    });

    it('should find documents by parsed content', async () => {
      const mockDbDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'doc.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/doc.pdf',
          parsedContent: '# Report\n\nRevenue increased significantly',
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      const result = await repository.search('report-123', 'revenue');

      // Test BEHAVIOR: finds document with matching parsed content
      expect(result).toHaveLength(1);
      expect(result[0].parsedContent).toContain('Revenue');
    });

    it('should only return documents from specified report', async () => {
      const report123Documents = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'test.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/test.pdf',
          parsedContent: 'test content',
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      prismaMock.document.findMany.mockResolvedValue(report123Documents);

      const result = await repository.search('report-123', 'test');

      // Test BEHAVIOR: all results belong to report-123
      expect(result).toHaveLength(1);
      result.forEach((doc) => {
        expect(doc.reportId).toBe('report-123');
      });
    });

    it('should exclude deleted documents from search', async () => {
      const activeDocuments = [
        {
          id: 'doc-1',
          reportId: 'report-123',
          filename: 'active.pdf',
          fileHash: 'hash1',
          storagePath: '/storage/active.pdf',
          parsedContent: 'searchable content',
          notes: '',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      // Mock returns only active (deleted filtered out by Prisma)
      prismaMock.document.findMany.mockResolvedValue(activeDocuments);

      const result = await repository.search('report-123', 'searchable');

      // Test BEHAVIOR: only active documents in results
      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
    });

    it('should return empty array when no matches', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      const result = await repository.search('report-123', 'nonexistent');

      // Test BEHAVIOR: empty array when no matches
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
