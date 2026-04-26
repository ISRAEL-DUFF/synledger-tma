import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { PinVerificationDialog } from '@/components/security/PinVerificationDialog';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
type Token = 'USDT' | 'USDC';

interface SendResult {
  transferId: string;
  amount: number;
  currency: string;
  recipientName: string;
  status: string;
}

export default function P2PSend() {
  const { balance } = useWallet();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<Token>('USDC');
  const [note, setNote] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const availableBalance = token === 'USDT' ? balance.usdt : balance.usdc;
  const canContinue = recipient.trim().length >= 3 && amountNum > 0 && amountNum <= availableBalance;

  const confirmSend = useCallback(async () => {
    setFlowState('processing');
    setFailureReason('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ success: boolean; data: SendResult }>('/payments/send-user', {
        recipientIdentifier: recipient.trim(),
        amount: amountNum,
        currency: token,
        note: note || undefined,
      });
      setResult(response.data);
      setFlowState('success');
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Transfer failed. Check recipient or balance.');
      setFlowState('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [recipient, amountNum, token, note]);

  function reset() {
    setFlowState('input');
    setRecipient('');
    setAmount('');
    setNote('');
    setFailureReason('');
    setResult(null);
  }

  // ─── Processing ──────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Send" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Sending...</h2>
            <p className="text-muted-foreground text-sm mt-1">{amount} {token} to {recipient}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ─── Success ──────────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Send" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{amount} {token}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sent to <span className="font-semibold text-foreground">{result?.recipientName || recipient}</span>
            </p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Recipient" value={result?.recipientName || recipient} />
            <DetailRow label="Amount" value={`${amount} ${token}`} />
            <DetailRow label="Status" value={result?.status || 'Completed'} />
            {result?.transferId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Transfer ID</span>
                <button
                  className="flex items-center gap-1 text-xs font-mono text-primary"
                  onClick={() => { navigator.clipboard.writeText(result.transferId); toast.success('Copied'); }}
                >
                  {result.transferId.slice(0, 8)}... <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>
          <Button className="w-full max-w-sm" onClick={reset}>
            <Send className="h-4 w-4 mr-2" /> Send Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Send" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Transfer Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{failureReason}</p>
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
      <PageLayout title="Review Transfer" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Sending</p>
            <h2 className="text-3xl font-bold mt-1">{amount} {token}</h2>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Recipient" value={recipient} />
            <DetailRow label="Amount" value={`${amount} ${token}`} />
            {note && <DetailRow label="Note" value={note} />}
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setPinDialogOpen(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Confirm & Send
          </Button>

          <PinVerificationDialog
            open={pinDialogOpen}
            onOpenChange={setPinDialogOpen}
            onVerified={confirmSend}
            title="Confirm Transfer"
            description="Verify your transaction PIN before sending funds."
          />
        </div>
      </PageLayout>
    );
  }

  // ─── Input ──────────────────────────────────────
  return (
    <PageLayout title="Send to User" showBack>
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Send Crypto to User</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send USDT or USDC to another iSpend user instantly
          </p>
        </div>

        {/* Balance */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available {token}</span>
            <span className="font-semibold">{availableBalance.toFixed(4)}</span>
          </div>
        </Card>

        {/* Recipient */}
        <div className="space-y-2">
          <Label>Recipient</Label>
          <Input
            placeholder="Email, phone, or username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Enter the email, phone number, or username of the recipient</p>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount ({token})</Label>
            <button
              className="text-xs text-primary underline"
              onClick={() => setAmount(String(availableBalance))}
            >
              Max: {availableBalance.toFixed(4)}
            </button>
          </div>
          <Input
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="text-lg font-semibold"
          />
          {amountNum > availableBalance && (
            <p className="text-xs text-destructive">Insufficient balance</p>
          )}
        </div>

        {/* Token */}
        <div className="flex gap-2">
          {(['USDC', 'USDT'] as Token[]).map((t) => (
            <Button key={t} variant={token === t ? 'default' : 'outline'} size="sm" onClick={() => setToken(t)}>
              {t}
            </Button>
          ))}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label>Note (Optional)</Label>
          <Input
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
          />
        </div>

        <Button className="w-full" size="lg" disabled={!canContinue} onClick={() => setFlowState('review')}>
          Continue
        </Button>
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
