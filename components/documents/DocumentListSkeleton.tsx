import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentListSkeleton() {
  return (
    <div className='h-full overflow-y-auto p-4'>
      <Skeleton className='mb-4 h-7 w-32' />
      <Skeleton className='mb-4 h-10 w-full' />
      <div className='space-y-2'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='p-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
              <Skeleton className='h-8 w-8 rounded' />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
