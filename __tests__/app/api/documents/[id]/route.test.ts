/**
 * GET & DELETE /api/documents/[id] API Route Tests
 *
 * Tests document retrieval and deletion endpoints.
 * Focuses on BEHAVIOR (what responses are returned), not implementation.
 *
 * @see docs/TDD-GUIDE.md - Section 3.4 (API Layer Testing)
 * @see docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 * @jest-environment node
 */

// Mock next-auth BEFORE importing route handler
jest.mock('next-auth');

// Mock auth options to avoid importing email providers
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
  },
}));

// Mock DocumentService dependencies
jest.mock('@/services/DocumentService');
jest.mock('@/infrastructure/repositories/PrismaDocumentRepository');
jest.mock('@/services/FileStorageService');
jest.mock('@/services/ParserService');

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, DELETE } from '@/app/api/documents/[id]/route';
import { DocumentService } from '@/services/DocumentService';
import { createMockDocument } from '@/__tests__/utils/factories';

describe('GET /api/documents/[id]', () => {
  let mockDocumentService: jest.Mocked<DocumentService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock DocumentService methods
    mockDocumentService = {
      uploadDocument: jest.fn(),
      getDocument: jest.fn(),
      listDocuments: jest.fn(),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
      searchDocuments: jest.fn(),
    } as any;

    // Make DocumentService constructor return our mock
    (
      DocumentService as jest.MockedClass<typeof DocumentService>
    ).mockImplementation(() => mockDocumentService);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange: No session (unauthenticated)
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act: Call endpoint
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (401 response returned)
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(mockDocumentService.getDocument).not.toHaveBeenCalled();
    });

    it('should return 401 when session exists but user is missing', async () => {
      // Arrange: Session without user
      (getServerSession as jest.Mock).mockResolvedValue({
        expires: '2025-12-31',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Successful Retrieval', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return document when found', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        id: 'doc-123',
        reportId: 'report-123',
        filename: 'test.txt',
        fileHash: 'abc123',
        storagePath: '/storage/report-123/abc123.txt',
        parsedContent: 'Parsed content',
        notes: 'Important document',
      });

      mockDocumentService.getDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (200 status and correct document returned)
      expect(response.status).toBe(200);
      expect(data.id).toBe('doc-123');
      expect(data.reportId).toBe('report-123');
      expect(data.filename).toBe('test.txt');
      expect(data.fileHash).toBe('abc123');
      expect(data.storagePath).toBe('/storage/report-123/abc123.txt');
      expect(data.parsedContent).toBe('Parsed content');
      expect(data.notes).toBe('Important document');
    });

    it('should return document with null parsed content', async () => {
      // Arrange: Document that failed parsing
      const mockDocument = createMockDocument({
        id: 'doc-123',
        parsedContent: null,
      });

      mockDocumentService.getDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(200);
      expect(data.parsedContent).toBeNull();
    });

    it('should return document with empty notes', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        id: 'doc-123',
        notes: '',
      });

      mockDocumentService.getDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(200);
      expect(data.notes).toBe('');
    });

    it('should include timestamps in response', async () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-01-02T00:00:00Z');

      const mockDocument = createMockDocument({
        id: 'doc-123',
        createdAt,
        updatedAt,
        deletedAt: null,
      });

      mockDocumentService.getDocument.mockResolvedValue(mockDocument);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (timestamps included)
      expect(response.status).toBe(200);
      expect(new Date(data.createdAt).toISOString()).toBe(
        createdAt.toISOString(),
      );
      expect(new Date(data.updatedAt).toISOString()).toBe(
        updatedAt.toISOString(),
      );
      expect(data.deletedAt).toBeNull();
    });
  });

  describe('Document Not Found', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 404 when document does not exist', async () => {
      // Arrange: Service throws "not found" error
      mockDocumentService.getDocument.mockRejectedValue(
        new Error('Document not found'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/nonexistent',
        {
          method: 'GET',
        },
      );

      const params = { id: 'nonexistent' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (404 status)
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Document not found' });
    });

    it('should return 404 for invalid UUID format', async () => {
      // Arrange
      mockDocumentService.getDocument.mockRejectedValue(
        new Error('Document not found'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/invalid-id',
        {
          method: 'GET',
        },
      );

      const params = { id: 'invalid-id' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should throw error for unexpected service errors', async () => {
      // Arrange: Service throws unexpected error
      mockDocumentService.getDocument.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'GET',
        },
      );

      const params = { id: 'doc-123' };

      // Act & Assert: Verify error is thrown (not caught)
      await expect(GET(request, { params })).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});

describe('DELETE /api/documents/[id]', () => {
  let mockDocumentService: jest.Mocked<DocumentService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock DocumentService methods
    mockDocumentService = {
      uploadDocument: jest.fn(),
      getDocument: jest.fn(),
      listDocuments: jest.fn(),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
      searchDocuments: jest.fn(),
    } as any;

    // Make DocumentService constructor return our mock
    (
      DocumentService as jest.MockedClass<typeof DocumentService>
    ).mockImplementation(() => mockDocumentService);
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange: No session (unauthenticated)
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-123' };

      // Act: Call endpoint
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (401 response returned)
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(mockDocumentService.deleteDocument).not.toHaveBeenCalled();
    });

    it('should return 401 when session exists but user is missing', async () => {
      // Arrange: Session without user
      (getServerSession as jest.Mock).mockResolvedValue({
        expires: '2025-12-31',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Successful Deletion', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should delete document and return 204', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockResolvedValue();

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-123' };

      // Act
      const response = await DELETE(request, { params });

      // Assert: Verify BEHAVIOR (204 No Content)
      expect(response.status).toBe(204);
      // 204 responses have no body
      expect(response.body).toBeNull();
    });

    it('should handle deletion of document with parsed content', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockResolvedValue();

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-with-content',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-with-content' };

      // Act
      const response = await DELETE(request, { params });

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(204);
    });

    it('should handle deletion of document without parsed content', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockResolvedValue();

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-no-content',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-no-content' };

      // Act
      const response = await DELETE(request, { params });

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(204);
    });
  });

  describe('Document Not Found', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 404 when document does not exist', async () => {
      // Arrange: Service throws "not found" error
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error('Document not found'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/nonexistent',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'nonexistent' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR (404 status)
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Document not found' });
    });

    it('should return 404 for invalid UUID format', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error('Document not found'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/invalid-id',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'invalid-id' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should throw error for storage deletion failures', async () => {
      // Arrange: Service throws storage error
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error('Failed to delete file from storage'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-123' };

      // Act & Assert: Verify error is thrown (not caught)
      await expect(DELETE(request, { params })).rejects.toThrow(
        'Failed to delete file from storage',
      );
    });

    it('should throw error for database errors', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/documents/doc-123',
        {
          method: 'DELETE',
        },
      );

      const params = { id: 'doc-123' };

      // Act & Assert
      await expect(DELETE(request, { params })).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should handle deletion with empty document ID parameter', async () => {
      // Arrange
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error('Document not found'),
      );

      const request = new NextRequest('http://localhost:3000/api/documents/', {
        method: 'DELETE',
      });

      const params = { id: '' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });
  });
});
