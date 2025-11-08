/**
 * DocumentList Component
 *
 * Displays list of documents for a report with delete functionality.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Document Components
 */

'use client';

import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { DocumentListSkeleton } from './DocumentListSkeleton';

interface DocumentListProps {
  reportId: string;
}

export function DocumentList({ reportId }: DocumentListProps) {
  const { documents, isLoading, deleteDocument } = useDocuments(reportId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      await deleteDocument.mutateAsync(documentToDelete);
      setDocumentToDelete(null);
    }
  };

  if (isLoading) {
    return <DocumentListSkeleton />;
  }

  return (
    <div className='h-full overflow-y-auto p-4'>
      <h2 className='mb-4 text-xl font-semibold'>Documents</h2>

      <DocumentUpload reportId={reportId} />

      {documents.length === 0 ? (
        <p className='text-sm text-gray-500'>
          No documents yet. Upload your first document!
        </p>
      ) : (
        <div className='space-y-2'>
          {documents.map((doc) => (
            <Card key={doc.id} className='p-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{doc.filename}</p>
                  {doc.notes && (
                    <p className='mt-1 text-xs text-gray-500'>{doc.notes}</p>
                  )}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDeleteClick(doc.id)}
                  aria-label='Delete'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title='Delete Document'
        description='Are you sure you want to delete this document? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        variant='destructive'
      />
    </div>
  );
}
