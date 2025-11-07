/**
 * useReports Hook
 *
 * Custom hook for managing reports using React Query.
 * Provides queries and mutations for CRUD operations.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Custom Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Report } from '@/domain/entities/Report';

export function useReports() {
  const queryClient = useQueryClient();

  // Fetch all reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json() as Promise<Report[]>;
    },
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create report');
      return res.json() as Promise<Report>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Update an existing report
  const updateReport = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Report> }) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update report');
      return res.json() as Promise<Report>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Delete a report
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  return {
    reports,
    isLoading,
    createReport,
    updateReport,
    deleteReport,
  };
}
