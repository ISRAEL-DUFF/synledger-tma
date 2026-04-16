import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, Check, Clock, Copy, History, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ON_RAMP_TERMINAL_STATUSES, type OnRampStatus, type OnRampRequest, useOnRampRequest } from '@/hooks/useOnRamp';

function statusColor(status: OnRampStatus): string {
  switch (status) {
    case 'completed':
      return 'text-success';
    case 'credited':
    case 'deposit_received':
      return 'text-primary';
    case 'pending':
      return 'text-warning';
    case 'expired':
    case 'failed':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

function statusBadge(status: OnRampStatus) {
  const variant = status === 'completed'
    ? 'default'
    : status === 'failed' || status === 'expired'
      ? 'destructive'
      : 'secondary';
  return <Badge variant={variant} className="text-xs capitalize">{status.replace('_', ' ')}</Badge>;
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function formatCountdown(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`max-w-[60%] text-right text-sm font-medium ${mono ? 'font-mono break-all' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function OnRampStatusContent({
  request,
  isFetching,
  copiedField,
  onCopy,
  onRefresh,
  onGoToHistory,
  onNewRequest,
}: {
  request: OnRampRequest;
  isFetching: boolean;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onRefresh: () => void;
  onGoToHistory: () => void;
  onNewRequest: () => void;
}) {
  const isTerminal = ON_RAMP_TERMINAL_STATUSES.includes(request.status);
  const countdown = request.status === 'pending' ? formatCountdown(request.expiresAt) : null;
  const hasVirtualAccountDetails = Boolean(
    request.virtualAccount?.accountNumber ||
    request.virtualAccount?.bankName ||
    request.virtualAccount?.accountName,
  );
  const withdrawalHandling = request.withdrawalAddress
    ? `${statusLabel(request.withdrawalStatus)} to ${request.withdrawalAddress.label}`
    : 'Funds stay in Synledger wallet';
  const activeStatusLabel = useMemo(() => statusLabel(request.status), [request.status]);
  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 py-4">
      <Card className="p-5 space-y-4 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Transfer to this account</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send the exact amount from any Nigerian bank account to trigger your {request.token} credit.
            </p>
          </div>
          {statusBadge(request.status)}
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-extrabold tracking-tight">{formatNgn(request.amountNgn)}</p>
          <p className="text-xs text-muted-foreground">Ref: {request.reference}</p>
        </div>

        {countdown ? (
          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            <Clock className="h-4 w-4" />
            Expires in {countdown}
          </div>
        ) : null}
      </Card>

      {hasVirtualAccountDetails && request.virtualAccount && (
        <Card className="p-4 space-y-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Virtual account details</p>
          </div>

          <div className="space-y-3">
            <DetailRow label="Bank" value={request.virtualAccount.bankName} />
            <DetailRow label="Account Name" value={request.virtualAccount.accountName} />
            <div className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">Account Number</span>
                <button
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  onClick={() => onCopy(request.virtualAccount!.accountNumber, 'acct')}
                >
                  {copiedField === 'acct' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </button>
              </div>
              <p className="font-mono text-2xl font-extrabold tracking-[0.18em] text-foreground">
                {request.virtualAccount.accountNumber}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCopy(request.virtualAccount!.accountNumber, 'acct')}
            >
              {copiedField === 'acct' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Account Number
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCopy(request.reference, 'reference')}
            >
              {copiedField === 'reference' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Reference
            </Button>
          </div>
        </Card>
      )}

      {!hasVirtualAccountDetails && request.status === 'pending' && (
        <Card className="p-4 space-y-2 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Account details unavailable</p>
          </div>
          <p className="text-sm text-muted-foreground">
            We have not received the virtual account payload yet. Use refresh to fetch the latest request details.
          </p>
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Progress</p>
          <span className={`text-xs font-semibold capitalize ${statusColor(request.status)}`}>
            {activeStatusLabel}
          </span>
        </div>

        <DetailRow label="Reference" value={request.reference} mono />
        <DetailRow label="Receive Asset" value={`${request.token} on ${request.chain}`} />
        <DetailRow
          label="Actual Transfer"
          value={request.actualAmountNgn ? formatNgn(request.actualAmountNgn) : 'Awaiting bank transfer'}
        />
        <DetailRow
          label="Estimated Credit"
          value={request.tokenAmount ? `${request.tokenAmount.toFixed(6)} ${request.token}` : 'Pending confirmation'}
        />
        {request.exchangeRate ? (
          <DetailRow label="Exchange Rate" value={`1 ${request.token} ≈ ${formatNgn(request.exchangeRate)}`} />
        ) : null}
        <DetailRow label="Withdrawal Handling" value={withdrawalHandling} />
        <DetailRow label="Created" value={new Date(request.createdAt).toLocaleString()} />
        <DetailRow label="Expires" value={new Date(request.expiresAt).toLocaleString()} />
        {request.withdrawalTxHash ? (
          <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Withdrawal Tx</span>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                onClick={() => onCopy(request.withdrawalTxHash!, 'tx')}
              >
                {copiedField === 'tx' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
            </div>
            <p className="break-all font-mono text-xs text-foreground">{request.withdrawalTxHash}</p>
          </div>
        ) : null}
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">What happens next?</p>
        <p className="text-sm text-muted-foreground">1. Transfer the exact amount shown above before expiry.</p>
        <p className="text-sm text-muted-foreground">2. We detect the bank payment and credit your selected stablecoin.</p>
        <p className="text-sm text-muted-foreground">3. If you selected a saved wallet, we attempt automatic on-chain withdrawal.</p>
      </Card>

      {!isTerminal && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">
          Auto-refreshing status every 8 seconds...
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onGoToHistory}>
          <History className="h-4 w-4 mr-2" /> View History
        </Button>
        <Button variant="outline" className="flex-1" onClick={onRefresh} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {isTerminal ? 'Refresh Details' : 'Check Status'}
        </Button>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onNewRequest}>
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>
    </div>
  );
}

export default function OnRampDetail() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const {
    data: request,
    isLoading,
    isFetching,
    refetch,
  } = useOnRampRequest(requestId ?? null);

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied');
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <PageLayout
      title="On-Ramp Status"
      showBack
      onBack={() => navigate('/on-ramp')}
      rightAction={(
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching || !request}
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      )}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading request...</p>
        </div>
      ) : request ? (
        <OnRampStatusContent
          request={request}
          isFetching={isFetching}
          copiedField={copiedField}
          onCopy={copyToClipboard}
          onRefresh={() => refetch()}
          onGoToHistory={() => navigate('/on-ramp/history')}
          onNewRequest={() => navigate('/on-ramp')}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <p className="text-base font-semibold">On-ramp request not found</p>
          <p className="text-sm text-muted-foreground">The request may have been removed or the link is invalid.</p>
          <Button onClick={() => navigate('/on-ramp')}>Back to On-Ramp</Button>
        </div>
      )}
    </PageLayout>
  );
}