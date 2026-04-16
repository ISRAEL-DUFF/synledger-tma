import { useState, useCallback, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Share2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { SupportedChain, getChainConfig } from '@/lib/chains-config';

const CHAIN_DEPOSIT_INFO: Record<string, { minDeposit: string; confirmations: number; arrivalTime: string }> = {
  base: { minDeposit: '$1.00', confirmations: 12, arrivalTime: '~30 seconds' },
  arbitrum: { minDeposit: '$1.00', confirmations: 12, arrivalTime: '~1 minute' },
  polygon: { minDeposit: '$1.00', confirmations: 12, arrivalTime: '~1 minute' },
  bsc: { minDeposit: '$1.00', confirmations: 15, arrivalTime: '~2 minutes' },
  ethereum: { minDeposit: '$5.00', confirmations: 12, arrivalTime: '~3 minutes' },
  tron: { minDeposit: '$1.00', confirmations: 20, arrivalTime: '~1 minute' },
  solana: { minDeposit: '$1.00', confirmations: 32, arrivalTime: '~30 seconds' },
};

interface WalletData {
  id: string;
  address: string;
  chain: string;
  type: string;
  status: string;
}

const DEPOSIT_CHAINS: SupportedChain[] = ['base', 'arbitrum', 'polygon', 'bsc', 'ethereum', 'tron', 'solana'];

export default function Deposit() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<SupportedChain>('base');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<WalletData[]>('/wallets/me');
      setWallets(data);
    } catch {
      toast.error('Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const selectedWallet = wallets.find((w) => w.chain === selectedChain);
  const depositInfo = CHAIN_DEPOSIT_INFO[selectedChain];

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (address: string) => {
    const chainName = getChainConfig(selectedChain)?.displayName || selectedChain;
    const text = `My ${chainName} deposit address:\n${address}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${chainName} Deposit Address`, text });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    }
  };

  return (
    <PageLayout title="Deposit Crypto" showBack>
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <ArrowDownLeft className="h-7 w-7 text-success" />
          </div>
          <h2 className="text-lg font-semibold">Fund Your Wallet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send USDT or USDC to your custodial address below
          </p>
        </div>

        {/* Chain Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Select Network</p>
          <div className="flex gap-2 flex-wrap">
            {DEPOSIT_CHAINS.map((chain) => {
              const config = getChainConfig(chain);
              return (
                <Button
                  key={chain}
                  variant={selectedChain === chain ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChain(chain)}
                  className="gap-1.5"
                >
                  <span>{config?.icon || '🌐'}</span>
                  {config?.displayName || chain}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Deposit Address */}
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : selectedWallet ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getChainConfig(selectedChain)?.icon || '🌐'}</span>
                  <div>
                    <p className="font-semibold text-sm">{getChainConfig(selectedChain)?.displayName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Custodial Wallet</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchWallets}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center py-3">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG
                    value={selectedWallet.address}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Address Display */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Deposit Address</p>
                <code className="text-xs font-mono break-all text-primary font-bold block leading-relaxed">
                  {selectedWallet.address}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedWallet.address, selectedWallet.id)}
                >
                  {copiedId === selectedWallet.id ? (
                    <><Check className="h-4 w-4 mr-2 text-success" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copy Address</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare(selectedWallet.address)}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>

              {/* Network Info Cards */}
              {depositInfo && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <p className="text-[10px] text-muted-foreground font-medium">Min Deposit</p>
                    </div>
                    <p className="text-sm font-bold">{depositInfo.minDeposit}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <p className="text-[10px] text-muted-foreground font-medium">Expected Arrival</p>
                    </div>
                    <p className="text-sm font-bold">{depositInfo.arrivalTime}</p>
                    <p className="text-[10px] text-muted-foreground">{depositInfo.confirmations} confirmations</p>
                  </div>
                </div>
              )}

              {/* Block Explorer */}
              <Button variant="ghost" className="w-full text-xs" asChild>
                <a
                  href={`${getChainConfig(selectedChain)?.blockExplorer?.mainnet || 'https://arbiscan.io'}/address/${selectedWallet.address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> View on Explorer
                </a>
              </Button>
            </Card>
          </motion.div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No wallet found for {getChainConfig(selectedChain)?.displayName || selectedChain}.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A wallet will be created automatically when you make your first transaction on this chain.
            </p>
          </Card>
        )}

        {/* Warning */}
        <Card className="p-4 bg-warning/10 border-warning/30">
          <p className="text-xs text-warning font-medium">Important</p>
          <p className="text-xs text-muted-foreground mt-1">
            Only send <span className="font-semibold">USDT</span> or <span className="font-semibold">USDC</span> on the{' '}
            <span className="font-semibold">{getChainConfig(selectedChain)?.displayName || selectedChain}</span> network.
            Sending other tokens or using the wrong network may result in permanent loss of funds.
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
