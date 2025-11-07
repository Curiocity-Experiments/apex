/**
 * Report Detail Page
 *
 * Split view: report editor on left, document list on right.
 *
 * @see docs/DEVELOPER-GUIDE.md - Phase 5: Pages
 */

import { ReportEditor } from '@/components/reports/ReportEditor';
import { DocumentList } from '@/components/documents/DocumentList';

export default function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className='flex h-screen'>
      <div className='flex-1 border-r'>
        <ReportEditor reportId={params.id} />
      </div>
      <div className='w-96'>
        <DocumentList reportId={params.id} />
      </div>
    </div>
  );
}
