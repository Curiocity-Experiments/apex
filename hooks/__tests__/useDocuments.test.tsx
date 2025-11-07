/**
 * useDocuments Hook Tests
 *
 * Tests the useDocuments hook following TDD behavior-focused testing principles.
 *
 * @see docs/TDD-GUIDE.md
 * @see docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDocuments } from '../useDocuments';
import { Document } from '@/domain/entities/Document';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryWrapper';
  return Wrapper;
};

describe('useDocuments', () => {
  const reportId = 'report-123';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fetching documents', () => {
    it('should fetch documents for a report', async () => {
      const mockDocuments: Document[] = [
        {
          id: 'doc-1',
          reportId,
          filename: 'report.pdf',
          fileHash: 'hash123',
          storagePath: '/storage/hash123.pdf',
          parsedContent: 'Parsed text',
          notes: 'Important document',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocuments,
      });

      const { result } = renderHook(() => useDocuments(reportId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // ✅ Test BEHAVIOR: Verify correct data is returned
      expect(result.current.documents).toEqual(mockDocuments);
      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents[0].filename).toBe('report.pdf');
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useDocuments(reportId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.documents).toEqual([]);
    });
  });

  describe('Uploading documents', () => {
    it('should upload a document', async () => {
      const mockFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const newDocument: Document = {
        id: 'doc-2',
        reportId,
        filename: 'test.pdf',
        fileHash: 'hash456',
        storagePath: '/storage/hash456.pdf',
        parsedContent: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useDocuments(reportId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newDocument,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [newDocument],
      });

      await result.current.uploadDocument.mutateAsync({
        file: mockFile,
        reportId,
      });

      // Verify FormData was sent correctly
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[0] === '/api/documents',
      );
      expect(fetchCall).toBeDefined();
      expect(fetchCall[1].method).toBe('POST');
    });
  });

  describe('Updating documents', () => {
    it('should update document notes', async () => {
      const updatedDoc: Document = {
        id: 'doc-1',
        reportId,
        filename: 'report.pdf',
        fileHash: 'hash123',
        storagePath: '/storage/hash123.pdf',
        parsedContent: 'Parsed text',
        notes: 'Updated notes',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-03'),
        deletedAt: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useDocuments(reportId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedDoc,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedDoc],
      });

      await result.current.updateDocument.mutateAsync({
        id: 'doc-1',
        data: { notes: 'Updated notes' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/documents/doc-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Updated notes' }),
      });
    });
  });

  describe('Deleting documents', () => {
    it('should delete a document', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useDocuments(reportId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await result.current.deleteDocument.mutateAsync('doc-1');

      expect(global.fetch).toHaveBeenCalledWith('/api/documents/doc-1', {
        method: 'DELETE',
      });
    });
  });
});
