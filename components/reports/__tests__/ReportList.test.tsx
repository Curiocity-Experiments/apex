/**
 * ReportList Component Tests
 *
 * Tests the ReportList component following TDD behavior-focused testing principles.
 * We test user interactions and visible output, not implementation details.
 *
 * @see docs/TDD-GUIDE.md
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportList } from '../ReportList';
import { useReports } from '@/hooks/useReports';

// Mock the useReports hook
jest.mock('@/hooks/useReports');

describe('ReportList', () => {
  const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should display loading skeleton', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: true,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      const { container } = render(<ReportList />);

      // Check for skeleton loading elements
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no reports', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      expect(
        screen.getByText(/no reports yet.*create your first report/i),
      ).toBeInTheDocument();
    });
  });

  describe('Report display', () => {
    it('should display reports in grid', () => {
      mockUseReports.mockReturnValue({
        reports: [
          {
            id: '1',
            name: 'Q4 Report',
            userId: 'user-1',
            content: '',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
            deletedAt: null,
          },
          {
            id: '2',
            name: 'Q3 Report',
            userId: 'user-1',
            content: '',
            createdAt: new Date('2025-01-02'),
            updatedAt: new Date('2025-01-02'),
            deletedAt: null,
          },
        ],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      expect(screen.getByText('Q4 Report')).toBeInTheDocument();
      expect(screen.getByText('Q3 Report')).toBeInTheDocument();
    });

    it('should display page title and new report button', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText(/new report/i)).toBeInTheDocument();
    });
  });

  describe('Create report flow', () => {
    it('should open create form when clicking new report button', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      fireEvent.click(screen.getByText(/new report/i));

      expect(screen.getByPlaceholderText(/report name/i)).toBeInTheDocument();
      expect(screen.getByText(/^create$/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });

    it('should create report when form submitted with valid name', async () => {
      const mockCreate = jest.fn().mockResolvedValue({});

      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: mockCreate,
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      // Open form
      fireEvent.click(screen.getByText(/new report/i));

      // Fill in name
      const input = screen.getByPlaceholderText(/report name/i);
      fireEvent.change(input, { target: { value: 'New Report' } });

      // Submit
      fireEvent.click(screen.getByText(/^create$/i));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith('New Report');
      });
    });

    it('should not create report with empty name', () => {
      const mockCreate = jest.fn();

      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: mockCreate,
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      // Open form
      fireEvent.click(screen.getByText(/new report/i));

      // Try to submit without entering name
      fireEvent.click(screen.getByText(/^create$/i));

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should not create report with whitespace-only name', () => {
      const mockCreate = jest.fn();

      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: mockCreate,
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      fireEvent.click(screen.getByText(/new report/i));

      const input = screen.getByPlaceholderText(/report name/i);
      fireEvent.change(input, { target: { value: '   ' } });

      fireEvent.click(screen.getByText(/^create$/i));

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should close form when cancel clicked', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: false,
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      // Open form
      fireEvent.click(screen.getByText(/new report/i));
      expect(screen.getByPlaceholderText(/report name/i)).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByText(/cancel/i));

      // Form should be closed
      expect(
        screen.queryByPlaceholderText(/report name/i),
      ).not.toBeInTheDocument();
    });

    it('should show creating state during submission', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        isLoading: false,
        createReport: {
          mutateAsync: jest.fn(),
          isPending: true, // Currently creating
        } as any,
        updateReport: { mutateAsync: jest.fn() } as any,
        deleteReport: { mutateAsync: jest.fn() } as any,
      });

      render(<ReportList />);

      fireEvent.click(screen.getByText(/new report/i));

      expect(screen.getByText(/creating/i)).toBeInTheDocument();
      expect(screen.getByText(/creating/i)).toBeDisabled();
    });
  });
});
