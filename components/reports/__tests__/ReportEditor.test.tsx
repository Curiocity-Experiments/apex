/**
 * ReportEditor Component Tests
 *
 * Tests the ReportEditor component with auto-save functionality.
 * Uses fake timers to test debounced updates.
 *
 * @see docs/TDD-GUIDE.md
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportEditor } from '../ReportEditor';
import { useReport } from '@/hooks/useReport';

// Mock the useReport hook
jest.mock('@/hooks/useReport');

// Mock SimpleMDE component (it's complex and not needed for testing behavior)
jest.mock('react-simplemde-editor', () => {
  return function SimpleMDE({ value, onChange }: any) {
    return (
      <textarea
        data-testid='markdown-editor'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

describe('ReportEditor', () => {
  const mockUseReport = useReport as jest.MockedFunction<typeof useReport>;
  const mockUpdateReport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading state', () => {
    it('should display loading state', () => {
      mockUseReport.mockReturnValue({
        report: undefined,
        isLoading: true,
        updateReport: { mutateAsync: mockUpdateReport } as any,
      });

      render(<ReportEditor reportId='report-1' />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Report display', () => {
    it('should display report name and content', async () => {
      mockUseReport.mockReturnValue({
        report: {
          id: 'report-1',
          name: 'Q4 Report',
          userId: 'user-1',
          content: '# Initial content',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        isLoading: false,
        updateReport: { mutateAsync: mockUpdateReport } as any,
      });

      render(<ReportEditor reportId='report-1' />);

      expect(screen.getByText('Q4 Report')).toBeInTheDocument();

      // Wait for dynamically imported editor to load
      await waitFor(() => {
        expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
      });

      expect(screen.getByTestId('markdown-editor')).toHaveValue(
        '# Initial content',
      );
    });
  });

  describe('Auto-save functionality', () => {
    it('should auto-save after 1 second of inactivity', async () => {
      mockUpdateReport.mockResolvedValue({});

      mockUseReport.mockReturnValue({
        report: {
          id: 'report-1',
          name: 'Q4 Report',
          userId: 'user-1',
          content: '# Initial content',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        isLoading: false,
        updateReport: { mutateAsync: mockUpdateReport } as any,
      });

      render(<ReportEditor reportId='report-1' />);

      const editor = screen.getByTestId('markdown-editor');

      // Change content
      fireEvent.change(editor, { target: { value: '# Updated content' } });

      // Should not call immediately
      expect(mockUpdateReport).not.toHaveBeenCalled();

      // Fast-forward 500ms (not enough time)
      jest.advanceTimersByTime(500);
      expect(mockUpdateReport).not.toHaveBeenCalled();

      // Fast-forward another 500ms (total 1000ms)
      jest.advanceTimersByTime(500);

      // Now it should call the update
      await waitFor(() => {
        expect(mockUpdateReport).toHaveBeenCalledWith({
          content: '# Updated content',
        });
      });
    });

    it('should reset debounce timer on new changes', async () => {
      mockUpdateReport.mockResolvedValue({});

      mockUseReport.mockReturnValue({
        report: {
          id: 'report-1',
          name: 'Q4 Report',
          userId: 'user-1',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        isLoading: false,
        updateReport: { mutateAsync: mockUpdateReport } as any,
      });

      render(<ReportEditor reportId='report-1' />);

      const editor = screen.getByTestId('markdown-editor');

      // First change
      fireEvent.change(editor, { target: { value: 'First' } });
      jest.advanceTimersByTime(800);

      // Second change (should reset timer)
      fireEvent.change(editor, { target: { value: 'Second' } });
      jest.advanceTimersByTime(800);

      // Still shouldn't have called (only 800ms since last change)
      expect(mockUpdateReport).not.toHaveBeenCalled();

      // Now advance the final 200ms
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockUpdateReport).toHaveBeenCalledTimes(1);
        expect(mockUpdateReport).toHaveBeenCalledWith({ content: 'Second' });
      });
    });

    it('should not save if content unchanged from initial', () => {
      mockUpdateReport.mockResolvedValue({});

      mockUseReport.mockReturnValue({
        report: {
          id: 'report-1',
          name: 'Q4 Report',
          userId: 'user-1',
          content: '# Content',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        isLoading: false,
        updateReport: { mutateAsync: mockUpdateReport } as any,
      });

      render(<ReportEditor reportId='report-1' />);

      // Advance time without making changes
      jest.advanceTimersByTime(2000);

      expect(mockUpdateReport).not.toHaveBeenCalled();
    });
  });
});
