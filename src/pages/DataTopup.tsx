import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Wifi,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useUnifiedPayment, usePaymentPolling, Token, QuoteResult } from '@/hooks/useUnifiedPayment';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
type Network = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

interface DataPlan {
  label: string;
  value: string;
  price: number;
}

const NETWORKS: Array<{ id: Network; label: string; color: string }> = [
  { id: 'MTN', label: 'MTN', color: '#F5C400' },
  { id: 'AIRTEL', label: 'Airtel', color: '#E11D2E' },
  { id: 'GLO', label: 'Glo', color: '#17A34A' },
  { id: '9MOBILE', label: '9Mobile', color: '#10B981' },
];

const DATA_PLANS: Record<Network, DataPlan[]> = {
  MTN: [
    { label: '500MB', value: '500MB', price: 200 },
    { label: '1GB', value: '1GB', price: 500 },
    { label: '2GB', value: '2GB', price: 1000 },
    { label: '5GB', value: '5GB', price: 2000 },
    { label: '10GB', value: '10GB', price: 3500 },
  ],
  AIRTEL: [
    { label: '500MB', value: '500MB', price: 200 },
    { label: '1.5GB', value: '1.5GB', price: 500 },
    { label: '3GB', value: '3GB', price: 1000 },
    { label: '5GB', value: '5GB', price: 2000 },
    { label: '10GB', value: '10GB', price: 3500 },
  ],
  GLO: [
    { label: '1GB', value: '1GB', price: 300 },
    { label: '2GB', value: '2GB', price: 600 },
    { label: '5GB', value: '5GB', price: 1500 },
    { label: '10GB', value: '10GB', price: 3000 },
  ],
  '9MOBILE': [
    { label: '500MB', value: '500MB', price: 200 },
    { label: '1.5GB', value: '1.5GB', price: 500 },
    { label: '3GB', value: '3GB', price: 1000 },
    { label: '5GB', value: '5GB', price: 2000 },
  ],
};

export default function DataTopup() {
  const {
    fetchQuote,
    fetchBalance,
    balance,
    submitLoading,
    initiateDataTopup,
    quoteLoading,
  } = useUnifiedPayment();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [network, setNetwork] = useState<Network>('MTN');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [token, setToken] = useState<Token>('USDC');
  const [failureReason, setFailureReason] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const { data: polledStatus } = usePaymentPolling(flowState === 'processing' ? paymentId : null);

  const amountNgn = selectedPlan?.price ?? 0;
  const plans = DATA_PLANS[network];
  const fxRate = useMemo(() => quote?.rate ?? 1600, [quote]);
  const feeCrypto = useMemo(() => quote?.fee ?? 0, [quote]);
  const feePercentage = useMemo(() => quote?.feePercentage ?? 1.5, [quote]);
  const totalCrypto = useMemo(() => quote?.total ?? 0, [quote]);
  const feeNgn = useMemo(() => feeCrypto * fxRate, [feeCrypto, fxRate]);

  const normalizedPhone = phone.replace(/\D/g, '');
  const isValidPhone = normalizedPhone.length === 11;
  const canContinue = isValidPhone && selectedPlan;

  useEffect(() => { fetchBalance(token); }, [token, fetchBalance]);

  // Auto-fetch quote when plan changes
  useEffect(() => {
    if (!selectedPlan) { setQuote(null); return; }
    let active = true;
    fetchQuote(selectedPlan.price, token)
      .then((q) => { if (active) setQuote(q); })
      .catch(() => { if (active) setQuote(null); });
    return () => { active = false; };
  }, [selectedPlan, token, fetchQuote]);

  // Poll for completion
  useEffect(() => {
    if (!polledStatus || flowState !== 'processing') return;
    if (polledStatus.status === 'COMPLETED' || polledStatus.status === 'PROCESSING_PAYOUT') {
      setFlowState('success');
    } else if (['FAILED', 'COMPENSATING', 'COMPENSATED'].includes(polledStatus.status)) {
      setFailureReason('Data purchase failed. Your balance has been restored.');
      setFlowState('failed');
    }
  }, [polledStatus, flowState]);

  const confirmPurchase = useCallback(async () => {
    if (!selectedPlan) return;
    setFlowState('processing');
    setFailureReason('');
    try {
      const response = await initiateDataTopup({
        amount: selectedPlan.price,
        phoneNumber: phone,
        network,
        plan: selectedPlan.value,
        token,
      });
      setPaymentId(response.paymentId);
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Data purchase failed');
      setFlowState('failed');
    }
  }, [selectedPlan, phone, network, token, initiateDataTopup]);

  function reset() {
    setFlowState('input');
    setNetwork('MTN');
    setPhone('');
    setSelectedPlan(null);
    setPaymentId(null);
    setQuote(null);
    setFailureReason('');
  }

  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  const activeNetwork = NETWORKS.find((n) => n.id === network)!;

  // ─── Processing ──────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Data Topup" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Data Purchase</h2>
            <p className="text-muted-foreground text-sm mt-1">{selectedPlan?.label} for {phone}</p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Network" value={network} />
            <DetailRow label="Phone" value={phone} />
            <DetailRow label="Plan" value={selectedPlan?.label || ''} />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label="Status" value={polledStatus?.status || 'PROCESSING'} />
          </Card>
        </div>
      </PageLayout>
    );
  }

  // ─── Success ──────────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Data Topup" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{selectedPlan?.label}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Data sent to <span className="font-semibold text-foreground">{phone}</span> on{' '}
              <span className="font-semibold text-foreground">{network}</span>
            </p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Network" value={network} />
            <DetailRow label="Plan" value={selectedPlan?.label || ''} />
            <DetailRow label="Phone" value={phone} />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label="Total Debited" value={`${totalCrypto.toFixed(6)} ${token}`} />
            {paymentId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment ID</span>
                <button
                  className="flex items-center gap-1 text-xs font-mono text-primary"
                  onClick={() => { navigator.clipboard.writeText(paymentId); toast.success('Copied'); }}
                >
                  {paymentId.slice(0, 8)}... <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>
          <Button className="w-full max-w-sm" onClick={reset}>
            <Wifi className="h-4 w-4 mr-2" /> Buy Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Data Topup" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Data Purchase Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{failureReason || 'Unable to complete purchase.'}</p>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <Button variant="outline" className="flex-1" onClick={reset}>Start Over</Button>
            <Button className="flex-1" onClick={() => setFlowState('review')}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ─── Review ─────────────────────────────────────
  if (flowState === 'review') {
    return (
      <PageLayout title="Review Purchase" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ backgroundColor: `${activeNetwork.color}22`, border: `2px solid ${activeNetwork.color}44` }}
            >
              <span className="text-lg font-bold" style={{ color: activeNetwork.color }}>{network.slice(0, 3)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Data Topup</p>
            <h2 className="text-3xl font-bold mt-1">{selectedPlan?.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">{formatNgn(amountNgn)} ≈ {totalCrypto.toFixed(6)} {token}</p>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Network" value={network} />
            <DetailRow label="Phone Number" value={phone} />
            <DetailRow label="Data Plan" value={selectedPlan?.label || ''} />
            <hr className="border-border/50" />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label={`Fee (${feePercentage}%)`} value={feeNgn > 0 ? formatNgn(feeNgn) : 'FREE'} />
            <DetailRow label="Rate" value={`1 ${token} = ${formatNgn(fxRate)}`} />
            <hr className="border-border/50" />
            <DetailRow label="Total Debit" value={`${totalCrypto.toFixed(6)} ${token}`} highlight />
          </Card>

          {balance && (
            <p className="text-xs text-muted-foreground text-center">
              Balance: {balance.available.toFixed(4)} {token}
              {balance.available < totalCrypto && <span className="text-destructive ml-2">Insufficient balance</span>}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={confirmPurchase}
            disabled={submitLoading || (balance ? balance.available < totalCrypto : false)}
          >
            {submitLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
            Confirm Purchase
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Input ──────────────────────────────────────
  return (
    <PageLayout title="Data Topup" showBack>
      <div className="space-y-6 py-4">
        {/* Network Selection */}
        <div className="space-y-2">
          <Label>Select Network</Label>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => { setNetwork(n.id); setSelectedPlan(null); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  network === n.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: n.color }}
                >
                  {n.id.slice(0, 3)}
                </div>
                <span className="text-xs font-medium">{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input
            placeholder="08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            maxLength={11}
            inputMode="tel"
          />
        </div>

        {/* Select Data Plan */}
        <div className="space-y-2">
          <Label>Select Plan</Label>
          <div className="grid grid-cols-2 gap-2">
            {plans.map((plan) => (
              <Card
                key={plan.value}
                className={`p-3 cursor-pointer transition-all text-center ${
                  selectedPlan?.value === plan.value ? 'border-primary bg-primary/5' : 'hover:border-border/80'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <p className="font-bold text-sm">{plan.label}</p>
                <p className="text-xs text-muted-foreground">{formatNgn(plan.price)}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quote Preview */}
        {quote && selectedPlan && (
          <Card className="p-3 bg-secondary/30 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rate</span>
              <span>1 {token} = {formatNgn(fxRate)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fee ({feePercentage}%)</span>
              <span>{feeCrypto.toFixed(6)} {token}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{totalCrypto.toFixed(6)} {token}</span>
            </div>
          </Card>
        )}

        {/* Token Toggle */}
        <div className="flex gap-2">
          {(['USDC', 'USDT'] as Token[]).map((t) => (
            <Button key={t} variant={token === t ? 'default' : 'outline'} size="sm" onClick={() => setToken(t)}>
              {t}
            </Button>
          ))}
        </div>

        <Button className="w-full" size="lg" disabled={!canContinue || quoteLoading} onClick={() => setFlowState('review')}>
          {quoteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Continue
        </Button>
      </div>
    </PageLayout>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-primary' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
