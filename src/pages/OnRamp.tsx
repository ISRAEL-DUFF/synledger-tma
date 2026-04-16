import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOnRampRequest, useOnRampRequests, type OnRampStatus } from '@/hooks/useOnRamp';
import { getWithdrawalAddresses, type WithdrawalAddress } from '@/lib/withdrawalAddressApi';
import { useExchangeRate } from '@/hooks/useExchangeRate';

const CHAINS = [
  { value: 'base', label: 'Base' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'bsc', label: 'BNB Smart Chain' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'tron', label: 'Tron' },
  { value: 'solana', label: 'Solana' },
];

const TOKENS = [
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

function statusBadge(status: OnRampStatus) {
  const variant = status === 'completed'
    ? 'default'
    : status === 'failed' || status === 'expired'
      ? 'destructive'
      : 'secondary';
  return <Badge variant={variant} className="text-xs capitalize">{status.replace('_', ' ')}</Badge>;
}

export default function OnRamp() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHistoryView = searchParams.get('tab') === 'history';

  const [amountText, setAmountText] = useState('');
  const [token, setToken] = useState('USDC');
  const [chain, setChain] = useState('base');
  const [withdrawalAddressId, setWithdrawalAddressId] = useState('');
  const [addresses, setAddresses] = useState<WithdrawalAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const createMutation = useCreateOnRampRequest();
  const { data: requests, isLoading: requestsLoading } = useOnRampRequests();
  const { data: exchangeRateData, isLoading: rateLoading } = useExchangeRate(token);

  const amountNgn = Number(amountText.replace(/,/g, '')) || 0;
  const rate = exchangeRateData?.effectiveRate || 0;
  const estimatedTokenAmount = rate > 0 ? (amountNgn / rate).toFixed(2) : '0.00';
  const canSubmit = amountNgn >= 100 && token && chain && rate > 0;

  useEffect(() => {
    setAddressesLoading(true);
    getWithdrawalAddresses()
      .then((results) => {
        setAddresses(results.filter((address) => address.isActive));
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
  }, []);

  const filteredAddresses = addresses.filter((address) => address.chain === chain && address.token === token);

  function setFormattedAmount(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setAmountText('');
      return;
    }

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

      toast.success('On-ramp request created');
      navigate(`/on-ramp/${result.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create request');
    }
  }

  const formatNgn = (value: number) => `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  if (isHistoryView) {
    return (
      <PageLayout title="On-Ramp History" showBack onBack={() => setSearchParams({})}>
        <div className="space-y-4 py-4">
          {requestsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))
          ) : !requests || requests.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">No on-ramp requests yet.</p>
            </Card>
          ) : (
            requests.map((request) => (
              <Card
                key={request.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => navigate(`/on-ramp/${request.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{formatNgn(request.amountNgn)}</p>
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

          <Button className="w-full" onClick={() => setSearchParams({})}>
            <Plus className="h-4 w-4 mr-2" /> New On-Ramp Request
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="On-Ramp" showBack>
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <ArrowDownLeft className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Fund your stablecoin wallet with NGN</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send naira, receive USDT/USDC in your wallet
          </p>
        </div>

        <div className="space-y-2">
          <Label>Amount (NGN)</Label>
          <Input
            placeholder="₦0"
            value={amountText}
            onChange={(event) => setFormattedAmount(event.target.value)}
            inputMode="numeric"
            className="text-lg font-semibold"
          />
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setFormattedAmount(String(amount))}
              >
                {formatNgn(amount)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Receive Token</Label>
          <div className="flex gap-2">
            {TOKENS.map((item) => (
              <Button
                key={item.value}
                variant={token === item.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setToken(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Network</Label>
          <Select value={chain} onValueChange={setChain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {amountNgn > 0 && (
          <Card className="p-4 space-y-3 bg-secondary/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount to Transfer</span>
              <span className="font-semibold text-sm">{formatNgn(amountNgn)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Rate</span>
              <span className="font-semibold text-sm">
                {rateLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : rate > 0 ? (
                  `1 ${token} ≈ ${formatNgn(rate)}`
                ) : (
                  'Unavailable'
                )}
              </span>
            </div>
            <div className="pt-3 mt-1 border-t flex justify-between items-center">
              <span className="font-semibold">Estimated Credit</span>
              <span className="font-bold text-primary text-lg">{estimatedTokenAmount} {token}</span>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-base">Delivery Destination</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Where should we send your {token} once the transfer is confirmed?
            </p>
          </div>

          <Card
            className={`p-4 border-2 cursor-pointer transition-all ${!withdrawalAddressId ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}`}
            onClick={() => setWithdrawalAddressId('')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Keep in Synledger Wallet</p>
                <p className="text-xs text-muted-foreground">Receive funds in your internal {token} balance</p>
              </div>
              {!withdrawalAddressId && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
          </Card>

          {addressesLoading ? (
            <Skeleton className="h-[72px] w-full rounded-xl" />
          ) : filteredAddresses.length > 0 ? (
            <div className="space-y-2">
              {filteredAddresses.map((address) => {
                const isSelected = withdrawalAddressId === address.id;
                return (
                  <Card
                    key={address.id}
                    className={`p-4 border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'}`}
                    onClick={() => setWithdrawalAddressId(address.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-full">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{address.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {address.address.slice(0, 8)}...{address.address.slice(-6)}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-4 border-2 border-dashed flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm font-medium">Auto-Withdraw to External Wallet?</p>
              <p className="text-xs text-muted-foreground">
                No saved addresses for {token} on {chain}.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/withdrawal-addresses')} className="mt-1">
                <Plus className="h-3 w-3 mr-1" /> Add Address
              </Button>
            </Card>
          )}
        </div>

        <Button className="w-full" size="lg" onClick={handleCreate} disabled={!canSubmit || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Generate Virtual Account
        </Button>

        {requests && requests.length > 0 && (
          <Button variant="ghost" className="w-full" onClick={() => setSearchParams({ tab: 'history' })}>
            <History className="h-4 w-4 mr-2" /> View On-Ramp History ({requests.length})
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
