import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportListSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className='h-6 w-3/4' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-4 w-1/2' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
