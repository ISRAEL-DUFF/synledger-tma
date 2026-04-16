import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Receipt,
  Zap,
  Tv,
  Globe,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useUnifiedPayment, usePaymentPolling, Token, QuoteResult } from '@/hooks/useUnifiedPayment';

type FlowState = 'selectCategory' | 'input' | 'review' | 'processing' | 'success' | 'failed';
type BillCategory = 'electricity' | 'cable-tv' | 'internet';

interface BillProvider {
  id: string;
  name: string;
  category: BillCategory;
  customerFieldLabel: string;
  minAmount: number;
}

const CATEGORIES: Array<{ id: BillCategory; label: string; icon: typeof Zap; color: string }> = [
  { id: 'electricity', label: 'Electricity', icon: Zap, color: '#F79009' },
  { id: 'cable-tv', label: 'Cable TV', icon: Tv, color: '#A78BFA' },
  { id: 'internet', label: 'Internet', icon: Globe, color: '#3C8DFF' },
];

const PROVIDERS: BillProvider[] = [
  { id: 'ikedc', name: 'IKEDC (Ikeja Electric)', category: 'electricity', customerFieldLabel: 'Meter Number', minAmount: 1000 },
  { id: 'ekedc', name: 'EKEDC (Eko Electric)', category: 'electricity', customerFieldLabel: 'Meter Number', minAmount: 1000 },
  { id: 'aedc', name: 'AEDC (Abuja Electric)', category: 'electricity', customerFieldLabel: 'Meter Number', minAmount: 1000 },
  { id: 'kedco', name: 'KEDCO (Kano Electric)', category: 'electricity', customerFieldLabel: 'Meter Number', minAmount: 1000 },
  { id: 'dstv', name: 'DStv', category: 'cable-tv', customerFieldLabel: 'Smart Card / IUC', minAmount: 1500 },
  { id: 'gotv', name: 'GOtv', category: 'cable-tv', customerFieldLabel: 'Smart Card / IUC', minAmount: 900 },
  { id: 'startimes', name: 'StarTimes', category: 'cable-tv', customerFieldLabel: 'Smart Card Number', minAmount: 500 },
  { id: 'spectranet', name: 'Spectranet', category: 'internet', customerFieldLabel: 'Customer ID', minAmount: 2000 },
  { id: 'smile', name: 'Smile', category: 'internet', customerFieldLabel: 'Customer ID', minAmount: 2000 },
];

const PRESETS_BY_CATEGORY: Record<BillCategory, number[]> = {
  electricity: [1000, 2000, 5000, 10000],
  'cable-tv': [2500, 5000, 10000, 15000],
  internet: [2000, 5000, 10000, 20000],
};

export default function PayBills() {
  const {
    fetchQuote,
    fetchBalance,
    balance,
    submitLoading,
    initiateBill,
    quoteLoading,
  } = useUnifiedPayment();

  const [flowState, setFlowState] = useState<FlowState>('selectCategory');
  const [category, setCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
  const [customerNumber, setCustomerNumber] = useState('');
  const [amountText, setAmountText] = useState('');
  const [token, setToken] = useState<Token>('USDC');
  const [failureReason, setFailureReason] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const { data: polledStatus } = usePaymentPolling(flowState === 'processing' ? paymentId : null);

  const amountNgn = useMemo(() => Number(amountText.replace(/,/g, '')) || 0, [amountText]);
  const fxRate = useMemo(() => quote?.rate ?? 1600, [quote]);
  const feeCrypto = useMemo(() => quote?.fee ?? 0, [quote]);
  const feePercentage = useMemo(() => quote?.feePercentage ?? 1.5, [quote]);
  const totalCrypto = useMemo(() => quote?.total ?? 0, [quote]);
  const feeNgn = useMemo(() => feeCrypto * fxRate, [feeCrypto, fxRate]);

  const filteredProviders = useMemo(
    () => (category ? PROVIDERS.filter((p) => p.category === category) : []),
    [category]
  );
  const presets = category ? PRESETS_BY_CATEGORY[category] : [];
  const minAmount = selectedProvider?.minAmount ?? 1000;
  const canContinue = selectedProvider && customerNumber.length >= 5 && amountNgn >= minAmount;

  useEffect(() => { fetchBalance(token); }, [token, fetchBalance]);

  // Auto-fetch quote
  useEffect(() => {
    if (amountNgn < minAmount) { setQuote(null); return; }
    let active = true;
    const timer = setTimeout(() => {
      fetchQuote(amountNgn, token)
        .then((q) => { if (active) setQuote(q); })
        .catch(() => { if (active) setQuote(null); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [amountNgn, token, fetchQuote, minAmount]);

  // Poll for completion
  useEffect(() => {
    if (!polledStatus || flowState !== 'processing') return;
    if (polledStatus.status === 'COMPLETED' || polledStatus.status === 'PROCESSING_PAYOUT') {
      setFlowState('success');
    } else if (['FAILED', 'COMPENSATING', 'COMPENSATED'].includes(polledStatus.status)) {
      setFailureReason('Bill payment failed. Your balance has been restored.');
      setFlowState('failed');
    }
  }, [polledStatus, flowState]);

  function setFormattedAmount(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) { setAmountText(''); return; }
    setAmountText(Number(digits).toLocaleString('en-NG'));
  }

  const confirmPayment = useCallback(async () => {
    if (!selectedProvider || !category) return;
    setFlowState('processing');
    setFailureReason('');
    try {
      const response = await initiateBill({
        amount: amountNgn,
        billType: category,
        provider: selectedProvider.id,
        accountNumber: customerNumber,
        token,
      });
      setPaymentId(response.paymentId);
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Bill payment failed');
      setFlowState('failed');
    }
  }, [selectedProvider, category, amountNgn, customerNumber, token, initiateBill]);

  function reset() {
    setFlowState('selectCategory');
    setCategory(null);
    setSelectedProvider(null);
    setCustomerNumber('');
    setAmountText('');
    setPaymentId(null);
    setQuote(null);
    setFailureReason('');
  }

  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  const categoryInfo = CATEGORIES.find((c) => c.id === category);

  // ─── Processing ──────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Pay Bills" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Bill Payment</h2>
            <p className="text-muted-foreground text-sm mt-1">{selectedProvider?.name} - {formatNgn(amountNgn)}</p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Provider" value={selectedProvider?.name || ''} />
            <DetailRow label={selectedProvider?.customerFieldLabel || 'Account'} value={customerNumber} />
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
      <PageLayout title="Pay Bills" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{formatNgn(amountNgn)}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Bill paid to <span className="font-semibold text-foreground">{selectedProvider?.name}</span>
            </p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Category" value={categoryInfo?.label || ''} />
            <DetailRow label="Provider" value={selectedProvider?.name || ''} />
            <DetailRow label={selectedProvider?.customerFieldLabel || 'Account'} value={customerNumber} />
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
            <Receipt className="h-4 w-4 mr-2" /> Pay Another Bill
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Pay Bills" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Bill Payment Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{failureReason || 'Unable to complete payment.'}</p>
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
      <PageLayout title="Review Payment" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-6 py-4">
          <div className="text-center">
            {categoryInfo && (
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${categoryInfo.color}22` }}>
                <categoryInfo.icon className="h-7 w-7" style={{ color: categoryInfo.color }} />
              </div>
            )}
            <p className="text-sm text-muted-foreground">{selectedProvider?.name}</p>
            <h2 className="text-3xl font-bold mt-1">{formatNgn(amountNgn)}</h2>
            <p className="text-sm text-muted-foreground mt-1">≈ {totalCrypto.toFixed(6)} {token}</p>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Category" value={categoryInfo?.label || ''} />
            <DetailRow label="Provider" value={selectedProvider?.name || ''} />
            <DetailRow label={selectedProvider?.customerFieldLabel || 'Account'} value={customerNumber} />
            <hr className="border-border/50" />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
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
              {balance.available < totalCrypto && <span className="text-destructive ml-2">Insufficient balance</span>}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={confirmPayment}
            disabled={submitLoading || (balance ? balance.available < totalCrypto : false)}
          >
            {submitLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
            Confirm Payment
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Input ──────────────────────────────────────
  if (flowState === 'input' && category && selectedProvider) {
    return (
      <PageLayout title={selectedProvider.name} showBack onBack={() => { setSelectedProvider(null); setFlowState('selectCategory'); }}>
        <div className="space-y-6 py-4">
          {/* Customer ID */}
          <div className="space-y-2">
            <Label>{selectedProvider.customerFieldLabel}</Label>
            <Input
              placeholder={`Enter ${selectedProvider.customerFieldLabel.toLowerCase()}`}
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            />
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
              {presets.map((amt) => (
                <Button key={amt} variant="outline" size="sm" className="text-xs" onClick={() => setFormattedAmount(String(amt))}>
                  {formatNgn(amt)}
                </Button>
              ))}
            </div>
          </div>

          {/* Quote Preview */}
          {quote && amountNgn >= minAmount && (
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

  // ─── Category & Provider Selection ──────────────
  return (
    <PageLayout title="Pay Bills" showBack>
      <div className="space-y-6 py-4">
        {/* Category Selection */}
        <div className="space-y-3">
          <Label className="text-base">Select Category</Label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  category === cat.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}22` }}>
                  <cat.icon className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Provider Selection */}
        {category && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Label className="text-base">Select Provider</Label>
            <div className="space-y-2">
              {filteredProviders.map((prov) => (
                <Card
                  key={prov.id}
                  className={`p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                    selectedProvider?.id === prov.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => { setSelectedProvider(prov); setFlowState('input'); }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{prov.name}</p>
                      <p className="text-xs text-muted-foreground">Min: {formatNgn(prov.minAmount)}</p>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
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
