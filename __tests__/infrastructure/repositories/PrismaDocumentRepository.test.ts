/**
 * PrismaDocumentRepository Tests
 *
 * Testing Prisma implementation of DocumentRepository interface.
 * Uses mocked Prisma client for fast, isolated tests.
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

      expect(result).not.toBeNull();
      expect(result?.id).toBe('doc-123');
      expect(result?.filename).toBe('test.pdf');
      expect(prismaMock.document.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
      });
    });

    it('should return null when not found', async () => {
      prismaMock.document.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

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

      expect(result?.deletedAt).not.toBeNull();
    });
  });

  describe('findByReportId', () => {
    it('should return active documents for report', async () => {
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

      expect(result).toHaveLength(2);
      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: {
          reportId: 'report-123',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should exclude deleted documents by default', async () => {
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
      ];

      prismaMock.document.findMany.mockResolvedValue(mockDbDocuments);

      await repository.findByReportId('report-123');

      expect(prismaMock.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
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

      expect(result).toHaveLength(2);
      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: {
          reportId: 'report-123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no documents found', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      const result = await repository.findByReportId('empty-report');

      expect(result).toEqual([]);
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

      expect(result).not.toBeNull();
      expect(result?.fileHash).toBe('abc123');
      expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
        where: {
          reportId: 'report-456',
          fileHash: 'abc123',
          deletedAt: null,
        },
      });
    });

    it('should return null when hash not found', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      const result = await repository.findByHash('report-456', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should only search within specified report', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      await repository.findByHash('report-specific', 'hash123');

      expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportId: 'report-specific',
          }),
        }),
      );
    });

    it('should exclude deleted documents', async () => {
      prismaMock.document.findFirst.mockResolvedValue(null);

      await repository.findByHash('report-456', 'hash123');

      expect(prismaMock.document.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('save', () => {
    it('should create new document', async () => {
      const newDocument: Document = createMockDocument({
        id: 'new-doc',
        reportId: 'report-123',
        filename: 'new.pdf',
      });

      const mockDbDocument = {
        ...newDocument,
        createdAt: newDocument.createdAt,
        updatedAt: newDocument.updatedAt,
        deletedAt: null,
      };

      prismaMock.document.upsert.mockResolvedValue(mockDbDocument);

      const result = await repository.save(newDocument);

      expect(result.id).toBe('new-doc');
      expect(prismaMock.document.upsert).toHaveBeenCalledWith({
        where: { id: 'new-doc' },
        create: {
          id: 'new-doc',
          reportId: 'report-123',
          filename: 'new.pdf',
          fileHash: newDocument.fileHash,
          storagePath: newDocument.storagePath,
          parsedContent: newDocument.parsedContent,
          notes: newDocument.notes,
          createdAt: newDocument.createdAt,
          updatedAt: newDocument.updatedAt,
          deletedAt: null,
        },
        update: {
          filename: 'new.pdf',
          parsedContent: newDocument.parsedContent,
          notes: newDocument.notes,
          updatedAt: newDocument.updatedAt,
          deletedAt: null,
        },
      });
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

      expect(result.notes).toBe('Updated notes');
      expect(result.parsedContent).toBe('Updated parsed content');
    });

    it('should handle restore of soft-deleted document', async () => {
      const restoredDocument: Document = createMockDocument({
        id: 'doc-123',
        deletedAt: null, // Restoring
      });

      const mockDbDocument = { ...restoredDocument, deletedAt: null };

      prismaMock.document.upsert.mockResolvedValue(mockDbDocument);

      const result = await repository.save(restoredDocument);

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

      expect(prismaMock.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-123' },
        data: {
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should not throw if document does not exist', async () => {
      prismaMock.document.update.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should search by filename', async () => {
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

      const result = await repository.search('report-123', 'earnings');

      expect(result).toHaveLength(1);
      expect(prismaMock.document.findMany).toHaveBeenCalledWith({
        where: {
          reportId: 'report-123',
          deletedAt: null,
          OR: [
            { filename: { contains: 'earnings', mode: 'insensitive' } },
            { notes: { contains: 'earnings', mode: 'insensitive' } },
            { parsedContent: { contains: 'earnings', mode: 'insensitive' } },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should search by notes', async () => {
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

      expect(result).toHaveLength(1);
    });

    it('should search by parsed content', async () => {
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

      expect(result).toHaveLength(1);
    });

    it('should only search within specified report', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      await repository.search('report-specific', 'test');

      expect(prismaMock.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportId: 'report-specific',
          }),
        }),
      );
    });

    it('should exclude deleted documents', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      await repository.search('report-123', 'test');

      expect(prismaMock.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should return empty array when no matches', async () => {
      prismaMock.document.findMany.mockResolvedValue([]);

      const result = await repository.search('report-123', 'nonexistent');

      expect(result).toEqual([]);
    });
  });
});
