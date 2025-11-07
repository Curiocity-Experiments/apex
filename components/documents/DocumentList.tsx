/**
 * DocumentList Component
 *
 * Displays list of documents for a report with delete functionality.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Document Components
 */

'use client';

import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface DocumentListProps {
  reportId: string;
}

export function DocumentList({ reportId }: DocumentListProps) {
  const { documents, isLoading, deleteDocument } = useDocuments(reportId);

  const handleDelete = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument.mutateAsync(documentId);
    }
  };

  if (isLoading) {
    return <div className='p-4'>Loading documents...</div>;
  }

  return (
    <div className='h-full overflow-y-auto p-4'>
      <h2 className='mb-4 text-xl font-semibold'>Documents</h2>

      {documents.length === 0 ? (
        <p className='text-sm text-gray-500'>No documents yet</p>
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
                  onClick={() => handleDelete(doc.id)}
                  aria-label='Delete'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
