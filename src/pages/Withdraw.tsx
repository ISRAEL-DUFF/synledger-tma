import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { getWithdrawalAddresses, type WithdrawalAddress } from '@/lib/withdrawalAddressApi';
import { getChainConfig, SupportedChain } from '@/lib/chains-config';

type FlowState = 'input' | 'review' | 'processing' | 'success' | 'failed';
type TokenSymbol = 'USDT' | 'USDC';

interface WalletData {
  id: string;
  address: string;
  chain: string;
  type: string;
}

export default function Withdraw() {
  const { balance, refreshBalance } = useWallet();

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<WithdrawalAddress[]>([]);
  const [selectedChain, setSelectedChain] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>('USDT');
  const [failureReason, setFailureReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{ txHash?: string } | null>(null);

  const selectedWallet = wallets.find((w) => w.chain === selectedChain);
  const amountNum = parseFloat(amount) || 0;
  const availableBalance = tokenSymbol === 'USDT' ? balance.usdt : balance.usdc;
  const canContinue = selectedChain && (targetAddress || selectedSavedAddressId) && amountNum > 0 && amountNum <= availableBalance;

  const filteredSavedAddresses = useMemo(
    () => savedAddresses.filter((a) => a.chain === selectedChain && a.token === tokenSymbol && a.isActive),
    [savedAddresses, selectedChain, tokenSymbol]
  );

  const uniqueChains = useMemo(
    () => [...new Set(wallets.map((w) => w.chain))],
    [wallets]
  );

  // Load wallets and saved addresses
  useEffect(() => {
    Promise.all([
      api.get<WalletData[]>('/wallets/me'),
      getWithdrawalAddresses(),
    ])
      .then(([ws, addrs]) => {
        setWallets(ws);
        setSavedAddresses(addrs.filter((a) => a.isActive));
        if (ws.length > 0 && !selectedChain) {
          setSelectedChain(ws[0].chain);
        }
      })
      .catch(() => toast.error('Failed to load wallet data'))
      .finally(() => setWalletsLoading(false));
  }, []);

  const resolveTargetAddress = () => {
    if (useSavedAddress && selectedSavedAddressId) {
      return savedAddresses.find((a) => a.id === selectedSavedAddressId)?.address || '';
    }
    return targetAddress;
  };

  const confirmWithdrawal = useCallback(async () => {
    const address = resolveTargetAddress();
    if (!address || !selectedChain) return;

    setFlowState('processing');
    setFailureReason('');
    setIsSubmitting(true);

    try {
      const result = await api.post<{ success: boolean; txHash?: string }>('/wallets/withdraw', {
        chain: selectedChain,
        amount,
        toAddress: address,
        tokenSymbol,
      });
      setTxResult(result);
      setFlowState('success');
      refreshBalance();
    } catch (err: unknown) {
      setFailureReason(err instanceof Error ? err.message : 'Withdrawal failed');
      setFlowState('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedChain, amount, targetAddress, selectedSavedAddressId, useSavedAddress, tokenSymbol, refreshBalance, savedAddresses]);

  function reset() {
    setFlowState('input');
    setTargetAddress('');
    setSelectedSavedAddressId('');
    setAmount('');
    setFailureReason('');
    setTxResult(null);
  }

  // ─── Processing ──────────────────────────────
  if (flowState === 'processing') {
    return (
      <PageLayout title="Withdraw" showBack onBack={() => {}}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Processing Withdrawal</h2>
            <p className="text-muted-foreground text-sm mt-1">{amount} {tokenSymbol} on {selectedChain}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ─── Success ──────────────────────────────────
  if (flowState === 'success') {
    return (
      <PageLayout title="Withdraw" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{amount} {tokenSymbol}</h2>
            <p className="text-muted-foreground text-sm mt-1">Withdrawal initiated successfully</p>
          </div>
          <Card className="w-full max-w-sm p-4 space-y-3">
            <DetailRow label="Chain" value={getChainConfig(selectedChain as SupportedChain)?.displayName || selectedChain} />
            <DetailRow label="Amount" value={`${amount} ${tokenSymbol}`} />
            <DetailRow label="To" value={`${resolveTargetAddress().slice(0, 10)}...${resolveTargetAddress().slice(-6)}`} />
            {txResult?.txHash && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tx Hash</span>
                <button
                  className="flex items-center gap-1 text-xs font-mono text-primary"
                  onClick={() => { navigator.clipboard.writeText(txResult.txHash!); toast.success('Copied'); }}
                >
                  {txResult.txHash.slice(0, 10)}... <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>
          <Button className="w-full max-w-sm" onClick={reset}>Done</Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Failed ────────────────────────────────────
  if (flowState === 'failed') {
    return (
      <PageLayout title="Withdraw" showBack onBack={reset}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Withdrawal Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{failureReason || 'Unable to complete withdrawal.'}</p>
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
    const address = resolveTargetAddress();
    return (
      <PageLayout title="Review Withdrawal" showBack onBack={() => setFlowState('input')}>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Withdrawing</p>
            <h2 className="text-3xl font-bold mt-1">{amount} {tokenSymbol}</h2>
          </div>

          <Card className="p-4 space-y-3">
            <DetailRow label="Chain" value={getChainConfig(selectedChain as SupportedChain)?.displayName || selectedChain} />
            <DetailRow label="Token" value={tokenSymbol} />
            <DetailRow label="Amount" value={`${amount} ${tokenSymbol}`} />
            <hr className="border-border/50" />
            <DetailRow label="Destination" value={`${address.slice(0, 10)}...${address.slice(-6)}`} />
          </Card>

          <Card className="p-4 bg-warning/10 border-warning/30">
            <p className="text-xs text-warning font-medium">Please verify</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ensure the destination address is correct. Withdrawals to incorrect addresses cannot be reversed.
            </p>
          </Card>

          <Button className="w-full" size="lg" onClick={confirmWithdrawal} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
            Confirm Withdrawal
          </Button>
        </div>
      </PageLayout>
    );
  }

  // ─── Input ──────────────────────────────────────
  return (
    <PageLayout title="Withdraw" showBack>
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Withdraw to External Wallet</h2>
        </div>

        {/* Balance Display */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available USDT</span>
            <span className="font-semibold">{balance.usdt.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Available USDC</span>
            <span className="font-semibold">{balance.usdc.toFixed(4)}</span>
          </div>
        </Card>

        {/* Token Selection */}
        <div className="space-y-2">
          <Label>Token</Label>
          <div className="flex gap-2">
            {(['USDT', 'USDC'] as TokenSymbol[]).map((t) => (
              <Button key={t} variant={tokenSymbol === t ? 'default' : 'outline'} size="sm" onClick={() => setTokenSymbol(t)}>
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Chain Selection */}
        <div className="space-y-2">
          <Label>Network</Label>
          {walletsLoading ? (
            <div className="h-10 bg-secondary/50 rounded-lg animate-pulse" />
          ) : (
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {uniqueChains.map((chain) => {
                  const config = getChainConfig(chain as SupportedChain);
                  return (
                    <SelectItem key={chain} value={chain}>
                      {config?.icon || '🌐'} {config?.displayName || chain}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Destination Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Destination Address</Label>
            {filteredSavedAddresses.length > 0 && (
              <button
                className="text-xs text-primary underline"
                onClick={() => { setUseSavedAddress(!useSavedAddress); setTargetAddress(''); setSelectedSavedAddressId(''); }}
              >
                {useSavedAddress ? 'Enter manually' : 'Use saved address'}
              </button>
            )}
          </div>

          {useSavedAddress ? (
            <Select value={selectedSavedAddressId} onValueChange={setSelectedSavedAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved address" />
              </SelectTrigger>
              <SelectContent>
                {filteredSavedAddresses.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} ({a.address.slice(0, 6)}...{a.address.slice(-4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="0x... or wallet address"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value.trim())}
              className="font-mono text-sm"
            />
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount ({tokenSymbol})</Label>
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
