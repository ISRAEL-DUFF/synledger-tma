import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/BalanceCard";
import { currentExchangeRate } from "@/lib/mockData";
import { useWallet } from "@/hooks/useWallet";
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
  History
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
}

export default function Wallet() {
  const navigate = useNavigate();
  const { isConnected, balance, refreshBalance } = useWallet();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            <Button variant="outline" size="icon" onClick={() => { fetchWallets(); refreshBalance(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/history")}>
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aggregate Balance Card */}
        {isConnected && (
          <BalanceCard
            usdtBalance={balance.usdt}
            usdcBalance={balance.usdc}
            ngnRate={currentExchangeRate}
            lockedAmount={balance.locked}
          />
        )}

        {/* Quick Transaction Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Deposit", icon: ArrowDownLeft, path: "/deposit", variant: "gradient" as const },
            { label: "Send", icon: Banknote, path: "/pay-vendor", variant: "outline" as const },
            { label: "Bill", icon: Receipt, path: "/services", variant: "outline" as const },
            { label: "Withdraw", icon: ArrowUpRight, path: "#", variant: "outline" as const, disabled: true },
          ].map((action, i) => (
            <Button
              key={i}
              variant={action.variant}
              className="flex-col h-20 gap-2 text-xs"
              onClick={() => !action.disabled && navigate(action.path)}
              disabled={action.disabled}
            >
              <action.icon className="h-5 w-5" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Wallets List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold">Your Custodial Addresses</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
              {wallets.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))
            ) : wallets.length > 0 ? (
              wallets.map((wallet) => {
                const chainInfo = getChainInfo(wallet.chain);
                return (
                  <Card key={wallet.id} className="overflow-hidden border-border/50 group hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-secondary/30 to-background">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center text-xl shadow-sm">
                            {chainInfo.icon}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{chainInfo.name}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {wallet.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleCopy(wallet.address, wallet.id)}
                          >
                            {copiedId === wallet.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                            <a href={`https://arbiscan.io/address/${wallet.address}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-card flex flex-col gap-1 border-t border-border/20">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Address</p>
                        <code className="text-xs font-mono break-all text-primary/80 font-bold tracking-tight">
                          {wallet.address}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                  <WalletIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No wallets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex gap-3 italic text-xs text-primary/80">
            <span className="text-lg">🛡️</span>
            <p>
              Your funds are held in secure, institutional-grade custodial wallets managed by Synledger.
              Transactions are automated and monitored 24/7.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
