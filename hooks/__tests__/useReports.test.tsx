/**
 * useReports Hook Tests
 *
 * Tests the useReports hook following TDD behavior-focused testing principles.
 * We test WHAT is returned, not HOW it's implemented.
 *
 * @see docs/TDD-GUIDE.md
 * @see docs/TDD-BEHAVIOR-VS-IMPLEMENTATION.md
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReports } from '../useReports';
import { Report } from '@/domain/entities/Report';

// Create a wrapper with QueryClient for testing hooks
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

describe('useReports', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fetching reports', () => {
    it('should fetch reports successfully', async () => {
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Q4 Report',
          userId: 'user-1',
          content: 'Content',
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
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReports,
      });

      const { result } = renderHook(() => useReports(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // ✅ Test BEHAVIOR: Verify correct data is returned
      expect(result.current.reports).toEqual(mockReports);
      expect(result.current.reports).toHaveLength(2);
      expect(result.current.reports[0].name).toBe('Q4 Report');
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useReports(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should return empty array on error (graceful degradation)
      expect(result.current.reports).toEqual([]);
    });
  });

  describe('Creating reports', () => {
    it('should create a report', async () => {
      const newReport: Report = {
        id: '3',
        name: 'New Report',
        userId: 'user-1',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock initial fetch (empty list)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useReports(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Mock create request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newReport,
      });

      // Mock refetch after create
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [newReport],
      });

      // ✅ Test BEHAVIOR: Create mutation works
      await result.current.createReport.mutateAsync('New Report');

      // Verify fetch was called with correct data
      expect(global.fetch).toHaveBeenCalledWith('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Report' }),
      });
    });

    it('should handle create error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useReports(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(
        result.current.createReport.mutateAsync(''),
      ).rejects.toThrow();
    });
  });

  describe('Updating reports', () => {
    it('should update a report', async () => {
      const updatedReport: Report = {
        id: '1',
        name: 'Updated Name',
        userId: 'user-1',
        content: 'Updated content',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-03'),
        deletedAt: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useReports(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedReport,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedReport],
      });

      await result.current.updateReport.mutateAsync({
        id: '1',
        data: { name: 'Updated Name', content: 'Updated content' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/reports/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Name',
          content: 'Updated content',
        }),
      });
    });
  });

  describe('Deleting reports', () => {
    it('should delete a report', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useReports(), {
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

      await result.current.deleteReport.mutateAsync('report-1');

      expect(global.fetch).toHaveBeenCalledWith('/api/reports/report-1', {
        method: 'DELETE',
      });
    });
  });
});
