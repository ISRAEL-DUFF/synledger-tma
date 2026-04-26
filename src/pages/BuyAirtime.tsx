import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Smartphone,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { PinVerificationDialog } from '@/components/security/PinVerificationDialog';
import { useUnifiedPayment, usePaymentPolling, Token, QuoteResult } from '@/hooks/useUnifiedPayment';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
type Provider = 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';

const PROVIDERS: Array<{ id: Provider; label: string; color: string }> = [
  { id: 'MTN', label: 'MTN', color: '#F5C400' },
  { id: 'AIRTEL', label: 'Airtel', color: '#E11D2E' },
  { id: 'GLO', label: 'Glo', color: '#17A34A' },
  { id: '9MOBILE', label: '9Mobile', color: '#10B981' },
];

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function BuyAirtime() {
  const {
    fetchQuote,
    fetchBalance,
    balance,
    submitLoading,
    initiateAirtime,
    quoteLoading,
  } = useUnifiedPayment();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [provider, setProvider] = useState<Provider>('MTN');
  const [phone, setPhone] = useState('');
  const [amountText, setAmountText] = useState('');
  const [token, setToken] = useState<Token>('USDC');
  const [failureReason, setFailureReason] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const { data: polledStatus } = usePaymentPolling(flowState === 'processing' ? paymentId : null);

  const amountNgn = useMemo(() => Number(amountText.replace(/,/g, '')) || 0, [amountText]);
  const fxRate = useMemo(() => quote?.rate ?? 1600, [quote]);
  const feeCrypto = useMemo(() => quote?.fee ?? 0, [quote]);
  const feePercentage = useMemo(() => quote?.feePercentage ?? 1.5, [quote]);
  const totalCrypto = useMemo(() => quote?.total ?? 0, [quote]);
  const feeNgn = useMemo(() => feeCrypto * fxRate, [feeCrypto, fxRate]);

  const normalizedPhone = phone.replace(/\D/g, '');
  const isValidPhone = normalizedPhone.length === 11;
  const canContinue = isValidPhone && amountNgn >= 100;

  useEffect(() => { fetchBalance(token); }, [token, fetchBalance]);

  // Auto-fetch quote
  useEffect(() => {
    if (amountNgn < 100) { setQuote(null); return; }
    let active = true;
    const timer = setTimeout(() => {
      fetchQuote(amountNgn, token)
        .then((q) => { if (active) setQuote(q); })
        .catch(() => { if (active) setQuote(null); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [amountNgn, token, fetchQuote]);

  // Poll for completion
  useEffect(() => {
    if (!polledStatus || flowState !== 'processing') return;
    if (polledStatus.status === 'COMPLETED' || polledStatus.status === 'PROCESSING_PAYOUT') {
      setFlowState('success');
    } else if (['FAILED', 'COMPENSATING', 'COMPENSATED'].includes(polledStatus.status)) {
      setFailureReason('Airtime purchase failed. Your balance has been restored.');
      setFlowState('failed');
    }
  }, [polledStatus, flowState]);

  function setFormattedAmount(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) { setAmountText(''); return; }
    setAmountText(Number(digits).toLocaleString('en-NG'));
  }

  const confirmPurchase = useCallback(async () => {
    setFlowState('processing');
    setFailureReason('');
    try {
      const response = await initiateAirtime({
        amount: amountNgn,
        phoneNumber: phone,
        network: provider,
        token,
      });
      setPaymentId(response.paymentId);
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Airtime purchase failed');
      setFlowState('failed');
    }
  }, [amountNgn, phone, provider, token, initiateAirtime]);

  function reset() {
    setFlowState('input');
    setProvider('MTN');
    setPhone('');
    setAmountText('');
    setPaymentId(null);
    setQuote(null);
    setFailureReason('');
  }

  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;

  // ─── Processing ──────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Buy Airtime" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Airtime</h2>
            <p className="text-muted-foreground text-sm mt-1">{formatNgn(amountNgn)} airtime to {phone}</p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Network" value={provider} />
            <DetailRow label="Phone" value={phone} />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label="Token Debit" value={`${totalCrypto.toFixed(6)} ${token}`} />
            <DetailRow label="Status" value={polledStatus?.status || 'PROCESSING'} />
          </Card>
        </div>
      </PageLayout>
    );
  }

  // ─── Success ──────────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Buy Airtime" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{formatNgn(amountNgn)}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Airtime sent to <span className="font-semibold text-foreground">{phone}</span> on{' '}
              <span className="font-semibold text-foreground">{provider}</span>
            </p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Network" value={provider} />
            <DetailRow label="Phone" value={phone} />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label={`Fee (${feePercentage}%)`} value={feeNgn > 0 ? formatNgn(feeNgn) : 'FREE'} />
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
            <Smartphone className="h-4 w-4 mr-2" /> Buy Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Buy Airtime" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Airtime Purchase Failed</h2>
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
              style={{ backgroundColor: `${activeProvider.color}22`, border: `2px solid ${activeProvider.color}44` }}
            >
              <span className="text-lg font-bold" style={{ color: activeProvider.color }}>{provider.slice(0, 3)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Airtime Purchase</p>
            <h2 className="text-3xl font-bold mt-1">{formatNgn(amountNgn)}</h2>
            <p className="text-sm text-muted-foreground mt-1">≈ {totalCrypto.toFixed(6)} {token}</p>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Network" value={provider} />
            <DetailRow label="Phone Number" value={phone} />
            <hr className="border-border/50" />
            <DetailRow label="Airtime Amount" value={formatNgn(amountNgn)} />
            <DetailRow label={`Fee (${feePercentage}%)`} value={feeNgn > 0 ? formatNgn(feeNgn) : 'FREE'} />
            <DetailRow label="Exchange Rate" value={`1 ${token} = ${formatNgn(fxRate)}`} />
            <hr className="border-border/50" />
            <DetailRow label="Total Debit" value={`${totalCrypto.toFixed(6)} ${token}`} highlight />
          </Card>

          <div className="flex gap-2">
            {(['USDC', 'USDT'] as Token[]).map((t) => (
              <Button key={t} variant={token === t ? 'default' : 'outline'} size="sm" onClick={() => setToken(t)}>
                {t}
              </Button>
            ))}
          </div>

          {balance && (
            <p className="text-xs text-muted-foreground text-center">
              Balance: {balance.available.toFixed(4)} {token}
              {balance.available < totalCrypto && (
                <span className="text-destructive ml-2">Insufficient balance</span>
              )}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => setPinDialogOpen(true)}
            disabled={submitLoading || (balance ? balance.available < totalCrypto : false)}
          >
            {submitLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
            Confirm Purchase
          </Button>

          <PinVerificationDialog
            open={pinDialogOpen}
            onOpenChange={setPinDialogOpen}
            onVerified={confirmPurchase}
            title="Confirm Airtime Purchase"
            description="Verify your transaction PIN before purchasing airtime."
          />
        </div>
      </PageLayout>
    );
  }

  // ─── Input ──────────────────────────────────────
  return (
    <PageLayout title="Buy Airtime" showBack>
      <div className="space-y-6 py-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>Select Network</Label>
          <div className="grid grid-cols-4 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  provider === p.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.id.slice(0, 3)}
                </div>
                <span className="text-xs font-medium">{p.label}</span>
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
          {phone.length > 0 && !isValidPhone && (
            <p className="text-xs text-muted-foreground">Enter 11-digit phone number</p>
          )}
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
              <Button
                key={amt}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setFormattedAmount(String(amt))}
              >
                {formatNgn(amt)}
              </Button>
            ))}
          </div>
        </div>

        {/* Quote Preview */}
        {quote && amountNgn >= 100 && (
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
