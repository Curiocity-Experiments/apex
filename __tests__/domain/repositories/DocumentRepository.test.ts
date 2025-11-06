/**
 * DocumentRepository Interface Tests
 *
 * Testing the DocumentRepository interface contract.
 * Reference: docs/TDD-GUIDE.md Section 3.2 (Repository Layer Testing)
 */

import { DocumentRepository } from '@/domain/repositories/DocumentRepository';
import { Document } from '@/domain/entities/Document';
import { createMockDocument } from '@/__tests__/utils/factories';

/**
 * Mock implementation for testing the interface contract
 */
class MockDocumentRepository implements DocumentRepository {
  private documents: Map<string, Document> = new Map();

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async findByReportId(
    reportId: string,
    includeDeleted?: boolean,
  ): Promise<Document[]> {
    const docs = Array.from(this.documents.values()).filter(
      (d) => d.reportId === reportId,
    );
    if (includeDeleted) {
      return docs;
    }
    return docs.filter((d) => d.deletedAt === null);
  }

  async findByHash(
    reportId: string,
    fileHash: string,
  ): Promise<Document | null> {
    const docs = Array.from(this.documents.values());
    return (
      docs.find(
        (d) =>
          d.reportId === reportId &&
          d.fileHash === fileHash &&
          d.deletedAt === null,
      ) || null
    );
  }

  async save(document: Document): Promise<Document> {
    this.documents.set(document.id, { ...document });
    return { ...document };
  }

  async delete(id: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.deletedAt = new Date();
      document.updatedAt = new Date();
    }
  }

  async search(reportId: string, query: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((d) => d.reportId === reportId && d.deletedAt === null)
      .filter(
        (d) =>
          d.filename.toLowerCase().includes(query.toLowerCase()) ||
          d.notes.toLowerCase().includes(query.toLowerCase()) ||
          (d.parsedContent &&
            d.parsedContent.toLowerCase().includes(query.toLowerCase())),
      );
  }

  // Helper for testing
  clear() {
    this.documents.clear();
  }
}

describe('DocumentRepository Interface', () => {
  let repository: MockDocumentRepository;

  beforeEach(() => {
    repository = new MockDocumentRepository();
  });

  describe('findById', () => {
    it('should return a document by id', async () => {
      const document = createMockDocument({ id: 'doc-123' });
      await repository.save(document);

      const found = await repository.findById('doc-123');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('doc-123');
    });

    it('should return null if document not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });

    it('should return deleted documents', async () => {
      const document = createMockDocument({
        id: 'doc-123',
        deletedAt: new Date(),
      });
      await repository.save(document);

      const found = await repository.findById('doc-123');

      expect(found).not.toBeNull();
      expect(found?.deletedAt).not.toBeNull();
    });
  });

  describe('findByReportId', () => {
    it('should return all active documents for a report', async () => {
      await repository.save(
        createMockDocument({
          id: 'd1',
          reportId: 'report-123',
          filename: 'doc1.pdf',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd2',
          reportId: 'report-123',
          filename: 'doc2.pdf',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd3',
          reportId: 'report-456',
          filename: 'doc3.pdf',
        }),
      );

      const documents = await repository.findByReportId('report-123');

      expect(documents).toHaveLength(2);
      expect(documents.map((d) => d.filename)).toContain('doc1.pdf');
      expect(documents.map((d) => d.filename)).toContain('doc2.pdf');
    });

    it('should exclude deleted documents by default', async () => {
      await repository.save(
        createMockDocument({
          id: 'd1',
          reportId: 'report-123',
          filename: 'active.pdf',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd2',
          reportId: 'report-123',
          filename: 'deleted.pdf',
          deletedAt: new Date(),
        }),
      );

      const documents = await repository.findByReportId('report-123');

      expect(documents).toHaveLength(1);
      expect(documents[0].filename).toBe('active.pdf');
    });

    it('should include deleted documents when requested', async () => {
      await repository.save(
        createMockDocument({
          id: 'd1',
          reportId: 'report-123',
          filename: 'active.pdf',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd2',
          reportId: 'report-123',
          filename: 'deleted.pdf',
          deletedAt: new Date(),
        }),
      );

      const documents = await repository.findByReportId('report-123', true);

      expect(documents).toHaveLength(2);
    });

    it('should return empty array if report has no documents', async () => {
      const documents = await repository.findByReportId('empty-report');

      expect(documents).toEqual([]);
    });
  });

  describe('findByHash', () => {
    it('should find document by file hash within a report', async () => {
      const document = createMockDocument({
        id: 'doc-123',
        reportId: 'report-456',
        fileHash: 'abc123',
      });
      await repository.save(document);

      const found = await repository.findByHash('report-456', 'abc123');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('doc-123');
      expect(found?.fileHash).toBe('abc123');
    });

    it('should return null if hash not found in report', async () => {
      await repository.save(
        createMockDocument({
          reportId: 'report-456',
          fileHash: 'abc123',
        }),
      );

      const found = await repository.findByHash('report-456', 'xyz789');

      expect(found).toBeNull();
    });

    it('should only search within specified report', async () => {
      await repository.save(
        createMockDocument({
          id: 'doc-1',
          reportId: 'report-123',
          fileHash: 'samehash',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'doc-2',
          reportId: 'report-456',
          fileHash: 'samehash',
        }),
      );

      const found = await repository.findByHash('report-456', 'samehash');

      expect(found?.id).toBe('doc-2');
      expect(found?.reportId).toBe('report-456');
    });

    it('should exclude deleted documents', async () => {
      await repository.save(
        createMockDocument({
          reportId: 'report-456',
          fileHash: 'abc123',
          deletedAt: new Date(),
        }),
      );

      const found = await repository.findByHash('report-456', 'abc123');

      expect(found).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a new document', async () => {
      const document = createMockDocument({ id: 'new-doc' });

      const saved = await repository.save(document);

      expect(saved.id).toBe('new-doc');

      const found = await repository.findById('new-doc');
      expect(found).not.toBeNull();
    });

    it('should update an existing document', async () => {
      const original = createMockDocument({
        id: 'doc-123',
        notes: 'Original notes',
      });
      await repository.save(original);

      const updated = { ...original, notes: 'Updated notes' };
      await repository.save(updated);

      const found = await repository.findById('doc-123');
      expect(found?.notes).toBe('Updated notes');
    });

    it('should return a copy of the saved document', async () => {
      const document = createMockDocument({ id: 'doc-123' });

      const saved = await repository.save(document);

      // Should not be the same object reference
      expect(saved).not.toBe(document);
      expect(saved).toEqual(document);
    });
  });

  describe('delete', () => {
    it('should soft delete a document', async () => {
      const document = createMockDocument({ id: 'doc-123' });
      await repository.save(document);

      await repository.delete('doc-123');

      const found = await repository.findById('doc-123');
      expect(found?.deletedAt).not.toBeNull();
    });

    it('should not throw if document does not exist', async () => {
      await expect(repository.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repository.save(
        createMockDocument({
          id: 'd1',
          reportId: 'report-123',
          filename: 'earnings-Q4.pdf',
          notes: 'Quarterly financial report',
          parsedContent: '# Earnings\n\nRevenue increased by 25%',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd2',
          reportId: 'report-123',
          filename: 'market-analysis.pdf',
          notes: 'Market trends document',
          parsedContent: '# Market Analysis\n\nGrowth in tech sector',
        }),
      );
      await repository.save(
        createMockDocument({
          id: 'd3',
          reportId: 'report-456',
          filename: 'summary.pdf',
          notes: 'Different report document',
          parsedContent: 'Summary content',
        }),
      );
    });

    it('should search documents by filename', async () => {
      const results = await repository.search('report-123', 'earnings');

      expect(results).toHaveLength(1);
      expect(results[0].filename).toBe('earnings-Q4.pdf');
    });

    it('should search documents by notes', async () => {
      const results = await repository.search('report-123', 'trends');

      expect(results).toHaveLength(1);
      expect(results[0].notes).toContain('trends');
    });

    it('should search documents by parsed content', async () => {
      const results = await repository.search('report-123', 'revenue');

      expect(results).toHaveLength(1);
      expect(results[0].parsedContent).toContain('Revenue');
    });

    it('should be case insensitive', async () => {
      const results = await repository.search('report-123', 'EARNINGS');

      expect(results).toHaveLength(1);
    });

    it('should only search within specified report', async () => {
      const results = await repository.search('report-123', 'pdf');

      expect(results).toHaveLength(2);
      results.forEach((doc) => {
        expect(doc.reportId).toBe('report-123');
      });
    });

    it('should exclude deleted documents from search', async () => {
      await repository.delete('d1');

      const results = await repository.search('report-123', 'earnings');

      expect(results).toHaveLength(0);
    });

    it('should return empty array if no matches', async () => {
      const results = await repository.search('report-123', 'nonexistent');

      expect(results).toEqual([]);
    });
  });
});
