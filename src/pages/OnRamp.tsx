import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronRight,
  History,
  Plus,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOnRampRequest, useOnRampRequests, useOnRampRequest, ON_RAMP_TERMINAL_STATUSES, type OnRampRequest, type OnRampStatus } from '@/hooks/useOnRamp';
import { getWithdrawalAddresses, type WithdrawalAddress } from '@/lib/withdrawalAddressApi';

type ViewState = 'create' | 'status' | 'history';

const CHAINS = [
  { value: 'base', label: 'Base' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'tron', label: 'Tron' },
  { value: 'solana', label: 'Solana' },
];

const TOKENS = [
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

function statusColor(status: OnRampStatus): string {
  switch (status) {
    case 'completed': return 'text-success';
    case 'credited': case 'deposit_received': return 'text-primary';
    case 'pending': return 'text-warning';
    case 'expired': case 'failed': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

function statusBadge(status: OnRampStatus) {
  const variant = status === 'completed' ? 'default'
    : status === 'failed' || status === 'expired' ? 'destructive'
    : 'secondary';
  return <Badge variant={variant} className="text-xs capitalize">{status.replace('_', ' ')}</Badge>;
}

export default function OnRamp() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('create');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  // Create form
  const [amountText, setAmountText] = useState('');
  const [token, setToken] = useState('USDC');
  const [chain, setChain] = useState('base');
  const [withdrawalAddressId, setWithdrawalAddressId] = useState('');
  const [addresses, setAddresses] = useState<WithdrawalAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const createMutation = useCreateOnRampRequest();
  const { data: requests, isLoading: requestsLoading } = useOnRampRequests();
  const { data: activeRequest } = useOnRampRequest(view === 'status' ? activeRequestId : null);

  const amountNgn = Number(amountText.replace(/,/g, '')) || 0;
  const canSubmit = amountNgn >= 100 && token && chain;

  // Load withdrawal addresses
  useEffect(() => {
    setAddressesLoading(true);
    getWithdrawalAddresses()
      .then((addrs) => {
        setAddresses(addrs.filter((a) => a.isActive));
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
  }, []);

  // Filter addresses by selected chain + token
  const filteredAddresses = addresses.filter(
    (a) => a.chain === chain && a.token === token
  );

  function setFormattedAmount(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) { setAmountText(''); return; }
    setAmountText(Number(digits).toLocaleString('en-NG'));
  }

  async function handleCreate() {
    try {
      const result = await createMutation.mutateAsync({
        amountNgn,
        token,
        chain,
        withdrawalAddressId: withdrawalAddressId || undefined,
      });
      setActiveRequestId(result.id);
      setView('status');
      toast.success('On-ramp request created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create request');
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied');
    setTimeout(() => setCopiedField(null), 2000);
  }

  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  // ─── Status View ──────────────────────────────
  if (view === 'status' && activeRequest) {
    const isTerminal = ON_RAMP_TERMINAL_STATUSES.includes(activeRequest.status);
    return (
      <PageLayout title="On-Ramp Status" showBack onBack={() => setView('create')}>
        <div className="space-y-6 py-4">
          {/* Status Header */}
          <div className="text-center">
            {activeRequest.status === 'completed' ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </motion.div>
            ) : activeRequest.status === 'failed' || activeRequest.status === 'expired' ? (
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-warning animate-pulse" />
              </div>
            )}

            <h2 className="text-lg font-semibold capitalize">{activeRequest.status.replace('_', ' ')}</h2>
            <p className="text-2xl font-bold mt-1">{formatNgn(activeRequest.amountNgn)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ref: {activeRequest.reference}</p>
          </div>

          {/* Virtual Account (Payment Instructions) */}
          {activeRequest.virtualAccount && activeRequest.status === 'pending' && (
            <Card className="p-4 space-y-3 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Transfer to this account</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Bank</span>
                  <span className="text-sm font-medium">{activeRequest.virtualAccount.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Account Name</span>
                  <span className="text-sm font-medium">{activeRequest.virtualAccount.accountName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Account Number</span>
                  <button
                    className="flex items-center gap-1 text-sm font-mono font-bold text-primary"
                    onClick={() => copyToClipboard(activeRequest.virtualAccount!.accountNumber, 'acct')}
                  >
                    {activeRequest.virtualAccount.accountNumber}
                    {copiedField === 'acct' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold">{formatNgn(activeRequest.amountNgn)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Transfer exactly {formatNgn(activeRequest.amountNgn)} to the account above. Your wallet will be credited automatically.
              </p>
            </Card>
          )}

          {/* Request Details */}
          <Card className="p-4 space-y-3">
            <DetailRow label="Token" value={`${activeRequest.token} on ${activeRequest.chain}`} />
            {activeRequest.exchangeRate && (
              <DetailRow label="Exchange Rate" value={`1 ${activeRequest.token} = ${formatNgn(activeRequest.exchangeRate)}`} />
            )}
            {activeRequest.tokenAmount && (
              <DetailRow label="You Receive" value={`${activeRequest.tokenAmount} ${activeRequest.token}`} />
            )}
            {activeRequest.withdrawalTxHash && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tx Hash</span>
                <button
                  className="flex items-center gap-1 text-xs font-mono text-primary"
                  onClick={() => copyToClipboard(activeRequest.withdrawalTxHash!, 'tx')}
                >
                  {activeRequest.withdrawalTxHash.slice(0, 10)}...
                  {copiedField === 'tx' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            <DetailRow label="Created" value={new Date(activeRequest.createdAt).toLocaleString()} />
            {activeRequest.expiresAt && (
              <DetailRow label="Expires" value={new Date(activeRequest.expiresAt).toLocaleString()} />
            )}
          </Card>

          {!isTerminal && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Auto-refreshing status every 8 seconds...
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setView('history')}>
              <History className="h-4 w-4 mr-2" /> View History
            </Button>
            <Button className="flex-1" onClick={() => { setActiveRequestId(null); setView('create'); }}>
              <Plus className="h-4 w-4 mr-2" /> New Request
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ─── Status View (Loading) ──────────────────────
  if (view === 'status' && !activeRequest) {
    return (
      <PageLayout title="On-Ramp Status" showBack onBack={() => setView('create')}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading request...</p>
        </div>
      </PageLayout>
    );
  }

  // ─── History View ────────────────────────────────
  if (view === 'history') {
    return (
      <PageLayout title="On-Ramp History" showBack onBack={() => setView('create')}>
        <div className="space-y-4 py-4">
          {requestsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : !requests || requests.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">No on-ramp requests yet.</p>
            </Card>
          ) : (
            requests.map((req) => (
              <Card
                key={req.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => { setActiveRequestId(req.id); setView('status'); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{formatNgn(req.amountNgn)}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.token} on {req.chain} &bull; {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(req.status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))
          )}
          <Button className="w-full" onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-2" /> New On-Ramp Request
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Create View ───────────────────────────────
  return (
    <PageLayout title="On-Ramp" showBack>
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <ArrowDownLeft className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Buy Crypto with NGN</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send naira, receive USDT/USDC in your wallet
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>Amount (NGN)</Label>
          <Input
            placeholder="₦0"
            value={amountText}
            onChange={(e) => setFormattedAmount(e.target.value)}
            inputMode="numeric"
            className="text-lg font-semibold"
          />
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((amt) => (
              <Button key={amt} variant="outline" size="sm" className="text-xs" onClick={() => setFormattedAmount(String(amt))}>
                {formatNgn(amt)}
              </Button>
            ))}
          </div>
        </div>

        {/* Token */}
        <div className="space-y-2">
          <Label>Receive Token</Label>
          <div className="flex gap-2">
            {TOKENS.map((t) => (
              <Button key={t.value} variant={token === t.value ? 'default' : 'outline'} size="sm" onClick={() => setToken(t.value)}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chain */}
        <div className="space-y-2">
          <Label>Network</Label>
          <Select value={chain} onValueChange={setChain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Withdrawal Address (optional) */}
        <div className="space-y-2">
          <Label>Withdrawal Address (Optional)</Label>
          {addressesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : filteredAddresses.length > 0 ? (
            <Select value={withdrawalAddressId} onValueChange={setWithdrawalAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved address (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default (custodial wallet)</SelectItem>
                {filteredAddresses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} ({a.address.slice(0, 6)}...{a.address.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved addresses for {token} on {chain}.{' '}
              <button className="text-primary underline" onClick={() => navigate('/withdrawal-addresses')}>
                Add one
              </button>
            </p>
          )}
          <p className="text-xs text-muted-foreground">If left empty, funds go to your custodial wallet.</p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleCreate}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownLeft className="h-4 w-4 mr-2" />}
          Create On-Ramp Request
        </Button>

        {/* History Link */}
        {requests && requests.length > 0 && (
          <Button variant="ghost" className="w-full" onClick={() => setView('history')}>
            <History className="h-4 w-4 mr-2" /> View On-Ramp History ({requests.length})
          </Button>
        )}
      </div>
    </PageLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
