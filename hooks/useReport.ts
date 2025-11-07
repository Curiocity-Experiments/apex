/**
 * useReport Hook
 *
 * Custom hook for fetching a single report by ID.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Custom Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Report } from '@/domain/entities/Report';

export function useReport(reportId: string) {
  const queryClient = useQueryClient();

  // Fetch single report
  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', reportId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json() as Promise<Report>;
    },
    enabled: !!reportId,
  });

  // Update this specific report
  const updateReport = useMutation({
    mutationFn: async (data: Partial<Report>) => {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update report');
      return res.json() as Promise<Report>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    report,
    isLoading,
    updateReport,
  };
}
