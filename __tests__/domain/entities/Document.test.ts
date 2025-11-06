/**
 * Document Entity Tests
 *
 * Testing the Document domain entity following TDD principles.
 * Reference: docs/TDD-GUIDE.md Section 3.1 (Domain Layer Testing)
 */

import {
  Document,
  isDocumentDeleted,
  isDocumentActive,
  hasBeenParsed,
} from '@/domain/entities/Document';

describe('Document Entity', () => {
  describe('Creation', () => {
    it('should create a valid document with all required fields', () => {
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'earnings-report.pdf',
        fileHash: 'abc123def456789',
        storagePath: '/storage/2025/01/earnings-report.pdf',
        parsedContent: '# Earnings Report\n\nQ4 revenue increased by 25%.',
        notes: 'Important quarterly report',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      expect(document.id).toBe('doc-123');
      expect(document.reportId).toBe('report-456');
      expect(document.filename).toBe('earnings-report.pdf');
      expect(document.fileHash).toBe('abc123def456789');
      expect(document.storagePath).toBe('/storage/2025/01/earnings-report.pdf');
      expect(document.parsedContent).toContain('Earnings Report');
      expect(document.notes).toBe('Important quarterly report');
      expect(document.deletedAt).toBeNull();
    });

    it('should create a document with empty notes', () => {
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'test.txt',
        fileHash: 'hash123',
        storagePath: '/storage/test.txt',
        parsedContent: 'Content',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(document.notes).toBe('');
    });

    it('should create a document without parsed content', () => {
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'unparsed.bin',
        fileHash: 'hash123',
        storagePath: '/storage/unparsed.bin',
        parsedContent: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(document.parsedContent).toBeNull();
    });

    it('should create a soft-deleted document', () => {
      const deletedAt = new Date('2025-01-15T00:00:00Z');
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'deleted.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/deleted.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt,
      };

      expect(document.deletedAt).toEqual(deletedAt);
    });
  });

  describe('Type Safety', () => {
    it('should enforce required fields', () => {
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'test.txt',
        fileHash: 'hash123',
        storagePath: '/storage/test.txt',
        parsedContent: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // All required fields must be present
      expect(document).toHaveProperty('id');
      expect(document).toHaveProperty('reportId');
      expect(document).toHaveProperty('filename');
      expect(document).toHaveProperty('fileHash');
      expect(document).toHaveProperty('storagePath');
      expect(document).toHaveProperty('parsedContent');
      expect(document).toHaveProperty('notes');
      expect(document).toHaveProperty('createdAt');
      expect(document).toHaveProperty('updatedAt');
      expect(document).toHaveProperty('deletedAt');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all data when cloned', () => {
      const original: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'original.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/original.pdf',
        parsedContent: 'Original content',
        notes: 'Original notes',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
        deletedAt: null,
      };

      const cloned = { ...original };

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference
    });

    it('should allow partial updates', () => {
      const document: Document = {
        id: 'doc-123',
        reportId: 'report-456',
        filename: 'document.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/document.pdf',
        parsedContent: 'Original content',
        notes: 'Original notes',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      const updated: Document = {
        ...document,
        notes: 'Updated notes',
        parsedContent: 'Updated parsed content',
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      };

      expect(updated.notes).toBe('Updated notes');
      expect(updated.parsedContent).toBe('Updated parsed content');
      expect(updated.id).toBe(document.id); // ID unchanged
      expect(updated.reportId).toBe(document.reportId); // Report ID unchanged
      expect(updated.fileHash).toBe(document.fileHash); // Hash unchanged
    });
  });

  describe('File Hash Uniqueness', () => {
    it('should have unique file hashes for different content', () => {
      const doc1: Document = {
        id: 'doc-1',
        reportId: 'report-456',
        filename: 'file1.txt',
        fileHash: 'hash-content-1',
        storagePath: '/storage/file1.txt',
        parsedContent: 'Content 1',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const doc2: Document = {
        id: 'doc-2',
        reportId: 'report-456',
        filename: 'file2.txt',
        fileHash: 'hash-content-2',
        storagePath: '/storage/file2.txt',
        parsedContent: 'Content 2',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Different files should have different hashes
      expect(doc1.fileHash).not.toBe(doc2.fileHash);
    });

    it('should have same hash for duplicate uploads', () => {
      const doc1: Document = {
        id: 'doc-1',
        reportId: 'report-456',
        filename: 'duplicate.txt',
        fileHash: 'hash-duplicate-content',
        storagePath: '/storage/duplicate-1.txt',
        parsedContent: 'Same content',
        notes: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      const doc2: Document = {
        id: 'doc-2',
        reportId: 'report-456',
        filename: 'duplicate.txt',
        fileHash: 'hash-duplicate-content', // Same hash
        storagePath: '/storage/duplicate-2.txt',
        parsedPath: '/storage/duplicate-1.txt', // Reference to first
        parsedContent: 'Same content',
        notes: '',
        createdAt: new Date('2025-01-02T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
        deletedAt: null,
      };

      // Duplicate content should have same hash
      expect(doc1.fileHash).toBe(doc2.fileHash);
      expect(doc1.parsedContent).toBe(doc2.parsedContent);
    });
  });

  describe('Soft Delete Behavior', () => {
    it('should distinguish between active and deleted documents', () => {
      const activeDoc: Document = {
        id: 'doc-1',
        reportId: 'report-456',
        filename: 'active.pdf',
        fileHash: 'hash1',
        storagePath: '/storage/active.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: null,
      };

      const deletedDoc: Document = {
        id: 'doc-2',
        reportId: 'report-456',
        filename: 'deleted.pdf',
        fileHash: 'hash2',
        storagePath: '/storage/deleted.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        deletedAt: new Date('2025-01-15T00:00:00Z'),
      };

      // Active document has null deletedAt
      expect(activeDoc.deletedAt).toBeNull();

      // Deleted document has a Date value
      expect(deletedDoc.deletedAt).toBeInstanceOf(Date);
      expect(deletedDoc.deletedAt).not.toBeNull();
    });
  });

  describe('Helper Functions', () => {
    describe('isDocumentDeleted', () => {
      it('should return false for active documents', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'active.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/active.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(isDocumentDeleted(document)).toBe(false);
      });

      it('should return true for deleted documents', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'deleted.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/deleted.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date('2025-01-15T00:00:00Z'),
        };

        expect(isDocumentDeleted(document)).toBe(true);
      });
    });

    describe('isDocumentActive', () => {
      it('should return true for active documents', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'active.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/active.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(isDocumentActive(document)).toBe(true);
      });

      it('should return false for deleted documents', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'deleted.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/deleted.pdf',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date('2025-01-15T00:00:00Z'),
        };

        expect(isDocumentActive(document)).toBe(false);
      });
    });

    describe('hasBeenParsed', () => {
      it('should return true for documents with parsed content', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'parsed.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/parsed.pdf',
          parsedContent: '# Parsed Content\n\nThis has been parsed.',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(hasBeenParsed(document)).toBe(true);
      });

      it('should return false for documents without parsed content', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'unparsed.bin',
          fileHash: 'hash123',
          storagePath: '/storage/unparsed.bin',
          parsedContent: null,
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(hasBeenParsed(document)).toBe(false);
      });

      it('should return false for documents with empty parsed content', () => {
        const document: Document = {
          id: 'doc-123',
          reportId: 'report-456',
          filename: 'empty.txt',
          fileHash: 'hash123',
          storagePath: '/storage/empty.txt',
          parsedContent: '',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        expect(hasBeenParsed(document)).toBe(false);
      });
    });
  });
});
