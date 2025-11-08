/**
 * ReportList Component
 *
 * Displays a grid of reports with create functionality.
 * Uses React Query for data management.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Report Components
 */

'use client';

import { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { ReportCard } from './ReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ReportListSkeleton } from './ReportListSkeleton';

export function ReportList() {
  const { reports, isLoading, createReport } = useReports();
  const [showCreate, setShowCreate] = useState(false);
  const [newReportName, setNewReportName] = useState('');

  const handleCreate = async () => {
    if (!newReportName.trim()) return;

    await createReport.mutateAsync(newReportName);
    setNewReportName('');
    setShowCreate(false);
  };

  if (isLoading) {
    return (
      <div className='p-8'>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Reports</h1>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <ReportListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Reports</h1>
        <Button onClick={() => setShowCreate(true)}>+ New Report</Button>
      </div>

      {showCreate && (
        <Card className='mb-6 p-4'>
          <Input
            type='text'
            value={newReportName}
            onChange={(e) => setNewReportName(e.target.value)}
            placeholder='Report name...'
            className='mb-2'
            autoFocus
          />
          <div className='flex gap-2'>
            <Button onClick={handleCreate} disabled={createReport.isPending}>
              {createReport.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button variant='outline' onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
          {createReport.isError && (
            <p className='mt-2 text-sm text-red-600' role='alert'>
              Failed to create report. Please try again.
            </p>
          )}
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {reports.length === 0 && !showCreate && (
        <div className='text-center text-gray-500'>
          No reports yet. Create your first report!
        </div>
      )}
    </div>
  );
}
