import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/BalanceCard";
import { AssetsPanel } from "@/components/AssetsPanel";
import { currentExchangeRate } from "@/lib/mockData";
import { useWallet } from "@/hooks/useWallet";
import { useWalletPortfolio } from "@/hooks/useWalletPortfolio";
import { useWalletSync } from "@/hooks/useWalletSync";
import { getChainConfig, SupportedChain } from "@/lib/chains-config";
import { api } from "@/lib/api";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wallet as WalletIcon,
  Banknote,
  Receipt,
  Search,
  History,
  Plus,
  Landmark,
  Loader2,
  Grid
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletData {
  id: string;
  address: string;
  chain: string;
  type: string;
  status: string;
  createdAt: string;
  lastUsedAt?: string;
  metadata?: {
    createdForPurpose?: string;
  };
}

export default function Wallet() {
  const navigate = useNavigate();
  const { isConnected, balance, refreshBalance } = useWallet();
  const { portfolio, loading: portfolioLoading, error: portfolioError, refetch: refetchPortfolio } = useWalletPortfolio();
  const { syncWallet, isSyncing } = useWalletSync();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const fetchWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<WalletData[]>('/wallets/me');
      setWallets(data);
    } catch (err) {
      console.error('Failed to fetch wallets:', err);
      toast.error("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchWallets();
    }
  }, [isConnected, fetchWallets]);

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success("Address copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getChainInfo = (chain: string) => {
    const config = getChainConfig(chain as SupportedChain);
    return {
      name: config?.displayName || chain,
      icon: config?.icon || "🌐"
    };
  };

  const handleSync = async () => {
    const result = await syncWallet();
    if (result) {
      toast.success("Wallet sync started", { description: "Balances will update shortly" });
      // Refetch portfolio after a short delay to pick up new balances
      setTimeout(() => {
        refetchPortfolio();
        refreshBalance();
      }, 3000);
    } else {
      toast.error("Failed to sync wallet");
    }
  };

  const handleProvisionWallets = async () => {
    setIsProvisioning(true);
    try {
      await api.post('/api/telegram/bot/provision-wallets');
      toast.success("Wallets created successfully");
      fetchWallets();
      refetchPortfolio();
      refreshBalance();
    } catch {
      toast.error("Failed to create wallets");
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <PageLayout title="My Wallets">
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
            <p className="text-muted-foreground text-sm">Manage your cross-chain assets</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/history")}>
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aggregate Balance Card */}
        {isConnected && (
          <BalanceCard
            usdtBalance={balance.totalUsdt}
            usdcBalance={balance.totalUsdc}
            ngnRate={currentExchangeRate}
            lockedAmount={balance.locked}
          />
        )}

        {/* Quick Transaction Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Deposit", icon: ArrowDownLeft, path: "/deposit", variant: "gradient" as const, disabled: false },
            { label: "Send", icon: Banknote, path: "/pay-vendor", variant: "outline" as const, disabled: false },
            { label: "Withdraw", icon: ArrowUpRight, path: "/withdraw", variant: "outline" as const, disabled: false },
            { label: "More", icon: Grid, path: "/services", variant: "outline" as const, disabled: false },
          ].map((action, i) => (
            <Button
              key={i}
              variant={action.variant}
              className="flex-col h-20 gap-2 text-xs"
              onClick={() => {
                if (!action.disabled) {
                  navigate(action.path);
                }
              }}
              disabled={action.disabled}
            >
              <action.icon className="h-5 w-5" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* On-Ramp Card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-background">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">Bank Transfer On-Ramp</p>
                <p className="text-[10px] text-muted-foreground">Convert NGN to stablecoins via bank transfer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => navigate("/on-ramp")}>
                Start On-Ramp
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/on-ramp/history')}>
                <History className="h-3.5 w-3.5 mr-1.5" /> History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Assets Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold">Your Assets</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
              {portfolio.length} wallet{portfolio.length !== 1 ? 's' : ''}
            </span>
          </div>

          <AssetsPanel
            portfolio={portfolio}
            loading={portfolioLoading}
            error={portfolioError}
          />

          {/* Create Wallet button when no wallets */}
          {!portfolioLoading && portfolio.length === 0 && (
            <Button
              className="w-full"
              onClick={handleProvisionWallets}
              disabled={isProvisioning}
            >
              {isProvisioning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Wallets...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Create Wallets</>
              )}
            </Button>
          )}
        </div>

        {/* Security Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex gap-3 italic text-xs text-primary/80">
            <span className="text-lg">🛡️</span>
            <p>
              Your funds are held in secure, institutional-grade custodial wallets managed by iSpend.
              Transactions are automated and monitored 24/7.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageLayout>
  );
}
