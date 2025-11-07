/**
 * ReportCard Component
 *
 * Displays a single report in card format with link to detail page.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 4: Report Components
 */

'use client';

import { Report } from '@/domain/entities/Report';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/reports/${report.id}`}>
      <Card className='p-4 transition-shadow hover:shadow-lg'>
        <h3 className='text-lg font-semibold'>{report.name}</h3>
        <p className='mt-2 text-sm text-gray-500'>
          Updated {formatDate(report.updatedAt)}
        </p>
      </Card>
    </Link>
  );
}
