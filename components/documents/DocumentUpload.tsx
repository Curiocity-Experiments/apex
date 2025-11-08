/**
 * DocumentUpload Component
 *
 * File upload button with validation and error handling.
 * Supports .txt and .md files.
 *
 * @see docs/PHASE-6-FINDINGS.md - Critical Issue #3
 */

'use client';

import { useRef, useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface DocumentUploadProps {
  reportId: string;
}

export function DocumentUpload({ reportId }: DocumentUploadProps) {
  const { uploadDocument } = useDocuments(reportId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error state
    setError(null);

    // Validate file type
    const validExtensions = ['.txt', '.md'];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Only .txt and .md files are supported');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      await uploadDocument.mutateAsync({ file, reportId });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Handle duplicate file error (409)
      if (err instanceof Error) {
        if (err.message.includes('already exists')) {
          setError('This file has already been uploaded');
        } else {
          setError('Failed to upload document. Please try again.');
        }
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='mb-4'>
      <input
        ref={fileInputRef}
        type='file'
        accept='.txt,.md'
        onChange={handleFileSelect}
        className='hidden'
        aria-label='Upload document'
      />
      <Button
        onClick={handleButtonClick}
        disabled={uploadDocument.isPending}
        className='w-full'
      >
        <Upload className='mr-2 h-4 w-4' />
        {uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
      </Button>

      {error && (
        <p className='mt-2 text-sm text-red-600' role='alert'>
          {error}
        </p>
      )}

      {uploadDocument.isSuccess && !error && (
        <p className='mt-2 text-sm text-green-600'>Document uploaded successfully!</p>
      )}
    </div>
  );
}
