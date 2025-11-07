/**
 * ReportEditor Component
 *
 * Markdown editor with auto-save functionality.
 * Auto-saves content 1 second after user stops typing.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Report Editor
 */

'use client';

import { useEffect, useState } from 'react';
import { useReport } from '@/hooks/useReport';
import { useDebounce } from '@/hooks/useDebounce';
import dynamic from 'next/dynamic';

// Dynamically import SimpleMDE to avoid SSR issues
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface ReportEditorProps {
  reportId: string;
}

export function ReportEditor({ reportId }: ReportEditorProps) {
  const { report, isLoading, updateReport } = useReport(reportId);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const debouncedContent = useDebounce(content, 1000);

  // Initialize content when report loads
  useEffect(() => {
    if (report && !initialContent) {
      setContent(report.content);
      setInitialContent(report.content);
    }
  }, [report, initialContent]);

  // Auto-save when debounced content changes
  useEffect(() => {
    if (debouncedContent && debouncedContent !== initialContent && report) {
      updateReport.mutateAsync({ content: debouncedContent }).then(() => {
        // Update initial content after successful save
        setInitialContent(debouncedContent);
      });
    }
  }, [debouncedContent, initialContent, report, updateReport]);

  if (isLoading || !report) {
    return <div className='p-4'>Loading...</div>;
  }

  // Determine save status
  const getSaveStatus = () => {
    if (updateReport.isPending) {
      return <span className='text-sm text-gray-500'>Saving...</span>;
    }
    if (updateReport.isError) {
      return <span className='text-sm text-red-600'>Error saving</span>;
    }
    if (content !== debouncedContent) {
      return <span className='text-sm text-gray-400'>Unsaved changes</span>;
    }
    if (initialContent !== content) {
      return null; // Waiting for debounce
    }
    return <span className='text-sm text-green-600'>All changes saved</span>;
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>{report.name}</h1>
          {getSaveStatus()}
        </div>
      </div>
      <div className='flex-1 p-4'>
        <SimpleMDE
          value={content}
          onChange={setContent}
          options={{
            spellChecker: false,
            autosave: { enabled: false },
            placeholder: 'Start writing your report...',
            status: false,
            toolbar: [
              'bold',
              'italic',
              'heading',
              '|',
              'quote',
              'unordered-list',
              'ordered-list',
              '|',
              'link',
              'image',
              '|',
              'preview',
              'side-by-side',
              'fullscreen',
              '|',
              'guide',
            ],
          }}
        />
      </div>
    </div>
  );
}
