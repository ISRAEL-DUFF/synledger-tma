import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRightLeft, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useSwap } from '@/hooks/useSwap';
import { getChainConfig, SupportedChain } from '@/lib/chains-config';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
type TokenSymbol = 'USDT' | 'USDC';

interface WalletData {
  id: string;
  address: string;
  chain: string;
  type: string;
}

interface SwapResult {
  swapId: string;
  toAmount: string;
  fee: string;
}

const SWAP_FEE_BPS = 10; // 0.10% — mirrors backend default

export default function Swap() {
  const { balance, refreshBalance } = useWallet();
  const { executeSwap } = useSwap();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState('');
  const [fromToken, setFromToken] = useState<TokenSymbol>('USDT');
  const [toToken, setToToken] = useState<TokenSymbol>('USDC');
  const [amount, setAmount] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [result, setResult] = useState<SwapResult | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const availableBalance = fromToken === 'USDT' ? balance.usdt : balance.usdc;

  const feeAmount = useMemo(() => (amountNum * SWAP_FEE_BPS) / 10000, [amountNum]);
  const toAmount = useMemo(() => Math.max(0, amountNum - feeAmount), [amountNum, feeAmount]);

  const uniqueChains = useMemo(() => [...new Set(wallets.map((w) => w.chain))], [wallets]);
  const canContinue = selectedChain && amountNum > 0 && amountNum <= availableBalance;

  useEffect(() => {
    api.get<WalletData[]>('/wallets/me')
      .then((ws) => {
        setWallets(ws);
        if (ws.length > 0 && !selectedChain) setSelectedChain(ws[0].chain);
      })
      .catch(() => toast.error('Failed to load wallets'))
      .finally(() => setWalletsLoading(false));
  }, []);

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  const handleMax = () => {
    setAmount(availableBalance.toFixed(6));
  };

  const handleConfirmSwap = useCallback(async () => {
    setFlowState('processing');
    setFailureReason('');
    try {
      const swapResult = await executeSwap({
        chain: selectedChain,
        fromToken,
        toToken,
        amount,
      });
      setResult({
        swapId: swapResult.swapId,
        toAmount: swapResult.toAmount,
        fee: swapResult.fee,
      });
      setFlowState('success');
      refreshBalance();
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Swap failed');
      setFlowState('failed');
    }
  }, [selectedChain, fromToken, toToken, amount, executeSwap, refreshBalance]);

  const reset = () => {
    setFlowState('input');
    setAmount('');
    setFailureReason('');
    setResult(null);
  };

  const chainLabel = (chain: string) => {
    try { return getChainConfig(chain as SupportedChain)?.name ?? chain; }
    catch { return chain; }
  };

  // ── Processing ───────────────────────────────────────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Swap" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Swap</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {amount} {fromToken} → {toAmount.toFixed(6)} {toToken}
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Swap" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Swap Completed!</h2>
            <p className="text-muted-foreground text-sm">
              {amount} {fromToken} → {result?.toAmount ?? toAmount.toFixed(6)} {toToken}
            </p>
            <p className="text-xs text-muted-foreground">
              Fee: {result?.fee ?? feeAmount.toFixed(6)} {fromToken} · on {chainLabel(selectedChain)}
            </p>
          </div>
          <Button onClick={reset} className="w-full">Swap Again</Button>
        </div>
      </PageLayout>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Swap" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Swap Failed</h2>
            <p className="text-muted-foreground text-sm">{failureReason || 'Something went wrong'}</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={reset} className="flex-1">New Swap</Button>
            <Button onClick={() => { setFlowState('review'); }} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────────
  if (flowState === 'review') {
    return (
      <PageLayout title="Review Swap" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You send</span>
              <span className="font-semibold">{amount} {fromToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You receive</span>
              <span className="font-semibold text-success">{toAmount.toFixed(6)} {toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee (0.10%)</span>
              <span className="font-semibold">{feeAmount.toFixed(6)} {fromToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold">1 {fromToken} ≈ 1 {toToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-semibold">{chainLabel(selectedChain)}</span>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground text-center px-4">
            This swap is instant and settled on the iSpend internal ledger. No on-chain transaction needed.
          </p>

          <Button onClick={handleConfirmSwap} className="w-full" size="lg">
            Confirm Swap
          </Button>
          <Button variant="outline" onClick={() => setFlowState('input')} className="w-full">
            Edit
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  return (
    <PageLayout title="Swap" showBack>
      <div className="space-y-5">

        {/* Token selector */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            {/* From token */}
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Select value={fromToken} onValueChange={(v) => {
                if (v === toToken) return; // prevent same token
                setFromToken(v as TokenSymbol);
                setAmount('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Balance: {availableBalance.toFixed(4)} {fromToken}
              </p>
            </div>

            {/* Flip button */}
            <button
              onClick={handleFlipTokens}
              className="mt-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors group"
              aria-label="Flip tokens"
            >
              <ArrowRightLeft className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </button>

            {/* To token */}
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">
                {toToken}
              </div>
              <p className="text-xs text-muted-foreground">
                {toAmount > 0 ? `≈ ${toAmount.toFixed(4)} ${toToken}` : '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Amount ({fromToken})</Label>
            <button onClick={handleMax} className="text-xs text-primary hover:underline">
              Max: {availableBalance.toFixed(4)}
            </button>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.000001"
          />
          {amountNum > availableBalance && (
            <p className="text-xs text-destructive">Insufficient {fromToken} balance</p>
          )}
        </div>

        {/* Chain */}
        <div className="space-y-2">
          <Label>Network</Label>
          {walletsLoading ? (
            <div className="h-10 rounded-md bg-muted animate-pulse" />
          ) : (
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {uniqueChains.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chainLabel(chain)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Fee preview */}
        {amountNum > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (0.10%)</span>
                <span>{feeAmount.toFixed(6)} {fromToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-semibold text-success">{toAmount.toFixed(6)} {toToken}</span>
              </div>
            </Card>
          </motion.div>
        )}

        <Button
          onClick={() => setFlowState('review')}
          disabled={!canContinue}
          className="w-full"
          size="lg"
        >
          Preview Swap
        </Button>
      </div>
    </PageLayout>
  );
}
