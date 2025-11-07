/**
 * useDocuments Hook
 *
 * Custom hook for managing documents within a report using React Query.
 * Provides queries and mutations for document CRUD operations.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Custom Hooks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document } from '@/domain/entities/Document';

export function useDocuments(reportId: string) {
  const queryClient = useQueryClient();

  // Fetch all documents for a report
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', reportId],
    queryFn: async () => {
      const res = await fetch(`/api/documents?reportId=${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json() as Promise<Document[]>;
    },
    enabled: !!reportId,
  });

  // Upload a new document
  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      reportId,
    }: {
      file: File;
      reportId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reportId', reportId);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload document');
      return res.json() as Promise<Document>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', reportId] });
    },
  });

  // Update a document
  const updateDocument = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Document>;
    }) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update document');
      return res.json() as Promise<Document>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', reportId] });
    },
  });

  // Delete a document
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', reportId] });
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument,
    updateDocument,
    deleteDocument,
  };
}
