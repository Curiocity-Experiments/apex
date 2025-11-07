/**
 * DocumentList Component Tests
 *
 * Tests the DocumentList component following TDD behavior-focused testing principles.
 *
 * @see docs/TDD-GUIDE.md
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentList } from '../DocumentList';
import { useDocuments } from '@/hooks/useDocuments';

jest.mock('@/hooks/useDocuments');

describe('DocumentList', () => {
  const mockUseDocuments = useDocuments as jest.MockedFunction<
    typeof useDocuments
  >;
  const reportId = 'report-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should display loading state', () => {
      mockUseDocuments.mockReturnValue({
        documents: [],
        isLoading: true,
        uploadDocument: { mutateAsync: jest.fn() } as any,
        updateDocument: { mutateAsync: jest.fn() } as any,
        deleteDocument: { mutateAsync: jest.fn() } as any,
      });

      render(<DocumentList reportId={reportId} />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no documents', () => {
      mockUseDocuments.mockReturnValue({
        documents: [],
        isLoading: false,
        uploadDocument: { mutateAsync: jest.fn() } as any,
        updateDocument: { mutateAsync: jest.fn() } as any,
        deleteDocument: { mutateAsync: jest.fn() } as any,
      });

      render(<DocumentList reportId={reportId} />);

      expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
    });
  });

  describe('Document display', () => {
    it('should display list of documents', () => {
      mockUseDocuments.mockReturnValue({
        documents: [
          {
            id: 'doc-1',
            reportId,
            filename: 'report.pdf',
            fileHash: 'hash1',
            storagePath: '/storage/hash1.pdf',
            parsedContent: 'Content',
            notes: '',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
            deletedAt: null,
          },
          {
            id: 'doc-2',
            reportId,
            filename: 'data.xlsx',
            fileHash: 'hash2',
            storagePath: '/storage/hash2.xlsx',
            parsedContent: null,
            notes: 'Important data',
            createdAt: new Date('2025-01-02'),
            updatedAt: new Date('2025-01-02'),
            deletedAt: null,
          },
        ],
        isLoading: false,
        uploadDocument: { mutateAsync: jest.fn() } as any,
        updateDocument: { mutateAsync: jest.fn() } as any,
        deleteDocument: { mutateAsync: jest.fn() } as any,
      });

      render(<DocumentList reportId={reportId} />);

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      expect(screen.getByText('data.xlsx')).toBeInTheDocument();
    });
  });

  describe('Delete functionality', () => {
    it('should delete document when delete button clicked', async () => {
      // Mock window.confirm to always return true
      global.confirm = jest.fn(() => true);

      const mockDelete = jest.fn().mockResolvedValue({});

      mockUseDocuments.mockReturnValue({
        documents: [
          {
            id: 'doc-1',
            reportId,
            filename: 'report.pdf',
            fileHash: 'hash1',
            storagePath: '/storage/hash1.pdf',
            parsedContent: 'Content',
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        isLoading: false,
        uploadDocument: { mutateAsync: jest.fn() } as any,
        updateDocument: { mutateAsync: jest.fn() } as any,
        deleteDocument: { mutateAsync: mockDelete } as any,
      });

      render(<DocumentList reportId={reportId} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('doc-1');
      });
    });
  });
});
