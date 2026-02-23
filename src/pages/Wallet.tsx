import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/BalanceCard";
import { currentExchangeRate } from "@/lib/mockData";
import { useWallet } from "@/hooks/useWallet";
import { getEnabledChains } from "@/lib/chains-config";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Link2,
  Wallet as WalletIcon,
  Banknote,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

const chains = getEnabledChains().map(c => ({
  id: c.id,
  name: c.displayName,
  symbol: c.nativeCurrency.symbol
}));


export default function Wallet() {
  const navigate = useNavigate();
  const { isConnected, address, shortenedAddress, walletType, balance } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageLayout title="Wallet">
      <div className="py-6">
        {/* Desktop: Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <h1 className="text-2xl font-bold">Wallet</h1>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </motion.div>



            {/* Balance Card - Only show when connected */}
            {isConnected && (
              <BalanceCard
                usdtBalance={balance.usdt}
                usdcBalance={balance.usdc}
                ngnRate={currentExchangeRate}
                lockedAmount={35.20}
              />
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <Button
                variant="gradient"
                size="lg"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/deposit")}
                disabled={!isConnected}
              >
                <ArrowDownLeft className="h-6 w-6" />
                <span>Deposit</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => toast.info("Withdraw feature coming soon")}
                disabled={!isConnected}
              >
                <ArrowUpRight className="h-6 w-6" />
                <span>Withdraw</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex-col gap-2 hidden lg:flex"
                onClick={() => navigate("/pay-vendor")}
                disabled={!isConnected}
              >
                <Banknote className="h-6 w-6" />
                <span>Send</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-auto py-4 flex-col gap-2 hidden lg:flex"
                onClick={() => navigate("/invoices")}
                disabled={!isConnected}
              >
                <Receipt className="h-6 w-6" />
                <span>Invoice</span>
              </Button>
            </motion.div>

            {/* Token Balances - Only show when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-semibold mb-3">Your Tokens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Card variant="elevated">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          💵
                        </div>
                        <div>
                          <p className="font-semibold">USDT</p>
                          <p className="text-xs text-muted-foreground">Tether USD</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${balance.usdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">
                          ≈ ₦{(balance.usdt * currentExchangeRate).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card variant="elevated">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          🔵
                        </div>
                        <div>
                          <p className="font-semibold">USDC</p>
                          <p className="text-xs text-muted-foreground">USD Coin</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${balance.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">
                          ≈ ₦{(balance.usdc * currentExchangeRate).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  {balance.eth > 0 && (
                    <Card variant="elevated">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                            ⟠
                          </div>
                          <div>
                            <p className="font-semibold">ETH</p>
                            <p className="text-xs text-muted-foreground">Ethereum</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{balance.eth.toFixed(6)} ETH</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Wallet Address - Only show when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card variant="outline">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground">Connected via</p>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">
                            {walletType}
                          </span>
                        </div>
                        <code className="text-sm font-mono">{shortenedAddress}</code>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleCopy}>
                        {copied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Chain Info - Only show when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="font-semibold mb-3">Supported Chains</h3>
                <Card variant="elevated">
                  <CardContent className="p-0 divide-y divide-border">
                    {chains.map((chain) => (
                      <div
                        key={chain.id}
                        className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
                            {chain.symbol.slice(0, 2)}
                          </div>
                          <span className="font-medium">{chain.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* View on Explorer - Only show when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://arbiscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Block Explorer
                  </a>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
