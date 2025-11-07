/**
 * POST /api/documents API Route Tests
 *
 * Tests document upload endpoint with multipart/form-data.
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
import { POST } from '@/app/api/documents/route';
import { DocumentService } from '@/services/DocumentService';
import { createMockDocument } from '@/__tests__/utils/factories';

describe('POST /api/documents', () => {
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

      const formData = new FormData();
      formData.append(
        'file',
        new File(['content'], 'test.txt', { type: 'text/plain' }),
      );
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act: Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (401 response returned)
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
    });

    it('should return 401 when session exists but user is missing', async () => {
      // Arrange: Session without user
      (getServerSession as jest.Mock).mockResolvedValue({
        expires: '2025-12-31',
      });

      const formData = new FormData();
      formData.append(
        'file',
        new File(['content'], 'test.txt', { type: 'text/plain' }),
      );
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      // Setup authenticated user for validation tests
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 400 when file is missing', async () => {
      // Arrange: FormData without file
      const formData = new FormData();
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (400 with error message)
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'File and reportId are required' });
      expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
    });

    it('should return 400 when reportId is missing', async () => {
      // Arrange: FormData without reportId
      const formData = new FormData();
      formData.append(
        'file',
        new File(['content'], 'test.txt', { type: 'text/plain' }),
      );

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'File and reportId are required' });
      expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
    });

    it('should return 400 when both file and reportId are missing', async () => {
      // Arrange: Empty FormData
      const formData = new FormData();

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'File and reportId are required' });
    });
  });

  describe('Successful Upload', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should upload document and return 201 with document data', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        id: 'doc-123',
        reportId: 'report-123',
        filename: 'test.txt',
        fileHash: 'abc123',
        storagePath: '/storage/report-123/abc123.txt',
        parsedContent: 'Parsed content',
        notes: '',
      });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['file content'], 'test.txt', {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (201 status and correct document returned)
      expect(response.status).toBe(201);
      expect(data.id).toBe('doc-123');
      expect(data.reportId).toBe('report-123');
      expect(data.filename).toBe('test.txt');
      expect(data.fileHash).toBe('abc123');
      expect(data.storagePath).toBe('/storage/report-123/abc123.txt');
      expect(data.parsedContent).toBe('Parsed content');
    });

    it('should handle text file upload', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        filename: 'document.txt',
        parsedContent: 'Text content',
      });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['text content'], 'document.txt', {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(201);
      expect(data.filename).toBe('document.txt');
      expect(data.parsedContent).toBe('Text content');
    });

    it('should handle markdown file upload', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        filename: 'README.md',
        parsedContent: '# Markdown content',
      });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['# Markdown'], 'README.md', {
        type: 'text/markdown',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(201);
      expect(data.filename).toBe('README.md');
    });

    it('should handle document with no parsed content', async () => {
      // Arrange: Document where parsing failed
      const mockDocument = createMockDocument({
        filename: 'test.txt',
        parsedContent: null, // Parsing failed
      });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (still successful, but no parsed content)
      expect(response.status).toBe(201);
      expect(data.parsedContent).toBeNull();
    });
  });

  describe('Duplicate File Handling', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should return 409 when document already exists', async () => {
      // Arrange: Service throws duplicate error
      mockDocumentService.uploadDocument.mockRejectedValue(
        new Error('Document already exists in this report'),
      );

      const file = new File(['content'], 'duplicate.txt', {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (409 conflict status)
      expect(response.status).toBe(409);
      expect(data).toEqual({
        error: 'Document already exists in this report',
      });
    });

    it('should return 409 when file with same hash exists', async () => {
      // Arrange
      mockDocumentService.uploadDocument.mockRejectedValue(
        new Error('Document already exists in this report'),
      );

      const file = new File(['same content'], 'different-name.txt', {
        type: 'text/plain',
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
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
      mockDocumentService.uploadDocument.mockRejectedValue(
        new Error('Storage service unavailable'),
      );

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act & Assert: Verify error is thrown (not caught)
      await expect(POST(request)).rejects.toThrow(
        'Storage service unavailable',
      );
    });

    it('should throw error for database errors', async () => {
      // Arrange
      mockDocumentService.uploadDocument.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act & Assert
      await expect(POST(request)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
    });

    it('should handle empty file', async () => {
      // Arrange
      const mockDocument = createMockDocument({
        filename: 'empty.txt',
        parsedContent: null,
      });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR (successful upload despite empty file)
      expect(response.status).toBe(201);
      expect(data.filename).toBe('empty.txt');
    });

    it('should handle filename with special characters', async () => {
      // Arrange
      const filename = 'test-file_v2.0 (final).txt';
      const mockDocument = createMockDocument({ filename });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['content'], filename, { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(201);
      expect(data.filename).toBe(filename);
    });

    it('should handle very long filename', async () => {
      // Arrange
      const filename = 'a'.repeat(200) + '.txt';
      const mockDocument = createMockDocument({ filename });

      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      const file = new File(['content'], filename, { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', 'report-123');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Verify BEHAVIOR
      expect(response.status).toBe(201);
      expect(data.filename).toBe(filename);
    });
  });
});
