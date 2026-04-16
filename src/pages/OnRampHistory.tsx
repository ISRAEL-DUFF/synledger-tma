import { useNavigate } from 'react-router-dom';
import { ChevronRight, History, Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnRampRequests, type OnRampStatus } from '@/hooks/useOnRamp';

function statusBadge(status: OnRampStatus) {
  const variant = status === 'completed'
    ? 'default'
    : status === 'failed' || status === 'expired'
      ? 'destructive'
      : 'secondary';

  return <Badge variant={variant} className="text-xs capitalize">{status.replace('_', ' ')}</Badge>;
}

export default function OnRampHistory() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useOnRampRequests();

  function formatNgn(value: number) {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  }

  return (
    <PageLayout title="On-Ramp History" showBack onBack={() => navigate('/on-ramp')}>
      <div className="space-y-4 py-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))
        ) : !requests || requests.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-secondary p-3">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No on-ramp requests yet</p>
                <p className="text-sm text-muted-foreground">Your created requests will appear here.</p>
              </div>
            </div>
          </Card>
        ) : (
          requests.map((request) => (
            <Card
              key={request.id}
              className="cursor-pointer p-4 transition-all hover:border-primary/50"
              onClick={() => navigate(`/on-ramp/${request.id}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{formatNgn(request.amountNgn)}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.token} on {request.chain} • {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(request.status)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))
        )}

        <Button className="w-full" onClick={() => navigate('/on-ramp')}>
          <Plus className="mr-2 h-4 w-4" /> New On-Ramp Request
        </Button>
      </div>
    </PageLayout>
  );
}