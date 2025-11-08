import { Skeleton } from '@/components/ui/skeleton';

export function ReportEditorSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <div className='border-b p-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-5 w-32' />
        </div>
      </div>
      <div className='flex-1 space-y-4 p-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    </div>
  );
}
