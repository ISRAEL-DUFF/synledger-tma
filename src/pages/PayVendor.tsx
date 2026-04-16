import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Banknote,
  Search,
  Check,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUnifiedPayment, usePaymentPolling, Token, QuoteResult } from '@/hooks/useUnifiedPayment';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
const PRESET_AMOUNTS = [5000, 10000, 20000, 50000];

export default function PayVendor() {
  const {
    banks,
    banksLoading,
    verifyAccount,
    fetchQuote,
    fetchBalance,
    balance,
    submitLoading,
    initiateTransfer,
    quoteLoading,
  } = useUnifiedPayment();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [narration, setNarration] = useState('');
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

  const filteredBanks = useMemo(() => {
    const search = bankSearch.trim().toLowerCase();
    if (!search) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(search));
  }, [bankSearch, banks]);

  const isVerified = Boolean(accountName) && !isResolving;
  const canContinue = selectedBank && accountNumber.length === 10 && isVerified && amountNgn >= 100;

  useEffect(() => {
    fetchBalance(token);
  }, [token, fetchBalance]);

  // Auto-resolve account
  useEffect(() => {
    if (!selectedBank || accountNumber.length !== 10) {
      setAccountName('');
      return;
    }
    setIsResolving(true);
    setAccountName('');
    let active = true;
    verifyAccount(accountNumber, selectedBank.code)
      .then((name) => { if (active) setAccountName(name); })
      .catch(() => { if (active) setAccountName(''); })
      .finally(() => { if (active) setIsResolving(false); });
    return () => { active = false; };
  }, [selectedBank, accountNumber, verifyAccount]);

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
      setFailureReason('Payment could not be completed. Funds have been automatically refunded.');
      setFlowState('failed');
    }
  }, [polledStatus, flowState]);

  function setFormattedAmount(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) { setAmountText(''); return; }
    setAmountText(Number(digits).toLocaleString('en-NG'));
  }

  const confirmPayment = useCallback(async () => {
    if (!selectedBank || !accountName) return;
    setFlowState('processing');
    setFailureReason('');
    try {
      const response = await initiateTransfer({
        accountNumber,
        accountName,
        accountBank: selectedBank.code,
        bankName: selectedBank.name,
        amount: amountNgn,
        narration: narration || undefined,
        token,
      });
      setPaymentId(response.paymentId);
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Payment failed');
      setFlowState('failed');
    }
  }, [selectedBank, accountName, accountNumber, amountNgn, narration, token, initiateTransfer]);

  function reset() {
    setFlowState('input');
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setAmountText('');
    setNarration('');
    setPaymentId(null);
    setQuote(null);
    setFailureReason('');
  }

  const formatNgn = (val: number) => `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  // ─── Processing ──────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Pay Vendor" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Transfer</h2>
            <p className="text-muted-foreground text-sm mt-1">Sending {formatNgn(amountNgn)} to {accountName}...</p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Recipient" value={accountName} />
            <DetailRow label="Bank" value={selectedBank?.name || ''} />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label="Token Debit" value={`${totalCrypto.toFixed(6)} ${token}`} />
            <DetailRow label="Status" value={polledStatus?.status || 'PROCESSING'} />
          </Card>
        </div>
      </PageLayout>
    );
  }

  // ─── Success ──────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Pay Vendor" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{formatNgn(amountNgn)}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sent to <span className="font-semibold text-foreground">{accountName}</span> at <span className="font-semibold text-foreground">{selectedBank?.name}</span>
            </p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Account" value={accountNumber} />
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
          <Button className="w-full max-w-sm" onClick={reset}>Send Again</Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Pay Vendor" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Transfer Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{failureReason || 'Unable to complete transfer.'}</p>
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

  // ─── Review ─────────────────────────────────
  if (flowState === 'review') {
    return (
      <PageLayout title="Review Transfer" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">You are sending</p>
            <h2 className="text-3xl font-bold mt-1">{formatNgn(amountNgn)}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ≈ {totalCrypto.toFixed(6)} {token}
            </p>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Recipient" value={accountName} />
            <DetailRow label="Account Number" value={accountNumber} />
            <DetailRow label="Bank" value={selectedBank?.name || ''} />
            <hr className="border-border/50" />
            <DetailRow label="Amount" value={formatNgn(amountNgn)} />
            <DetailRow label={`Fee (${feePercentage}%)`} value={feeNgn > 0 ? formatNgn(feeNgn) : 'FREE'} />
            <DetailRow label="Exchange Rate" value={`1 ${token} = ${formatNgn(fxRate)}`} />
            <hr className="border-border/50" />
            <DetailRow label="Total Debit" value={`${totalCrypto.toFixed(6)} ${token}`} highlight />
            {narration && <DetailRow label="Narration" value={narration} />}
          </Card>

          {/* Token toggle */}
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
            onClick={confirmPayment}
            disabled={submitLoading || (balance ? balance.available < totalCrypto : false)}
          >
            {submitLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Banknote className="h-4 w-4 mr-2" />}
            Confirm & Send
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Input ────────────────────────────────
  return (
    <PageLayout title="Pay Vendor" showBack>
      <div className="space-y-6 py-4">
        {/* Bank Selection */}
        <div className="space-y-2">
          <Label>Select Bank</Label>
          <Button
            variant="outline"
            className="w-full justify-between h-12"
            onClick={() => setShowBankModal(true)}
            disabled={banksLoading}
          >
            <span className={selectedBank ? 'text-foreground' : 'text-muted-foreground'}>
              {banksLoading ? 'Loading banks...' : selectedBank ? selectedBank.name : 'Choose a bank'}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label>Account Number</Label>
          <Input
            placeholder="Enter 10-digit account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
            inputMode="numeric"
          />
          {isResolving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Verifying account...
            </div>
          )}
          {accountName && (
            <div className="flex items-center gap-2 text-xs text-success">
              <Check className="h-3 w-3" /> {accountName}
            </div>
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

        {/* Narration */}
        <div className="space-y-2">
          <Label>Narration (Optional)</Label>
          <Input
            placeholder="Payment for..."
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            maxLength={100}
          />
        </div>

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

      {/* Bank Selection Modal */}
      <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Bank</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search banks..."
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-1">
            {filteredBanks.map((bank) => (
              <button
                key={bank.code}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors flex items-center justify-between"
                onClick={() => {
                  setSelectedBank(bank);
                  setShowBankModal(false);
                  setBankSearch('');
                }}
              >
                <span className="text-sm">{bank.name}</span>
                {selectedBank?.code === bank.code && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
            {filteredBanks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No banks found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
