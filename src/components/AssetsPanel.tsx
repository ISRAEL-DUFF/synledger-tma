import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { getChainConfig, SupportedChain } from '@/lib/chains-config';
import { WalletPortfolio } from '@/hooks/useWalletPortfolio';

function formatTokenBalance(rawBalance: string): string {
  const balance = parseFloat(rawBalance);
  if (isNaN(balance) || balance === 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
}

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletCard({ wallet }: { wallet: WalletPortfolio }) {
  const [copied, setCopied] = useState(false);
  const config = getChainConfig(wallet.chain as SupportedChain);
  const chainName = config?.displayName || wallet.chain;
  const chainIcon = config?.icon || '🌐';

  const usdtBalance = formatTokenBalance(wallet.tokens.usdt.balance);
  const usdcBalance = formatTokenBalance(wallet.tokens.usdc.balance);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-l-[3px]" style={{ borderLeftColor: config ? undefined : '#888' }}>
      <div className="p-3 flex items-center justify-between bg-gradient-to-r from-secondary/30 to-background">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-background border flex items-center justify-center text-lg shadow-sm">
            {chainIcon}
          </div>
          <div>
            <p className="font-bold text-sm">{chainName}</p>
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] font-mono text-muted-foreground">
                {truncateAddress(wallet.address)}
              </code>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-2.5 w-2.5 text-success" />
                ) : (
                  <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
          wallet.status === 'ACTIVE'
            ? 'bg-success/15 text-success'
            : 'bg-warning/15 text-warning'
        }`}>
          {wallet.status}
        </div>
      </div>

      {/* Token balances row */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-t border-border/20">
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#26A17B15] flex items-center justify-center text-[10px] font-bold text-[#26A17B]">₮</span>
            <span className="text-xs font-medium text-muted-foreground">USDT</span>
          </div>
          <p className="text-sm font-bold pl-6">{usdtBalance}</p>
        </div>
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#2775CA15] flex items-center justify-center text-[10px] font-bold text-[#2775CA]">$</span>
            <span className="text-xs font-medium text-muted-foreground">USDC</span>
          </div>
          <p className="text-sm font-bold pl-6">{usdcBalance}</p>
        </div>
      </div>
    </Card>
  );
}

interface AssetsPanelProps {
  portfolio: WalletPortfolio[];
  loading: boolean;
  error: string | null;
}

export function AssetsPanel({ portfolio, loading, error }: AssetsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array(2).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!loading && portfolio.length === 0) {
    return (
      <Card className="p-8 text-center space-y-2">
        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No wallets yet</p>
        <p className="text-xs text-muted-foreground">Create a wallet to see your assets</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
      {portfolio.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}
