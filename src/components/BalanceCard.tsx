import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface BalanceCardProps {
  usdtBalance: number;
  usdcBalance: number;
  ngnRate: number;
  lockedAmount?: number;
}

export function BalanceCard({ usdtBalance, usdcBalance, ngnRate, lockedAmount = 0 }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const totalUsd = usdtBalance + usdcBalance;
  const totalNgn = totalUsd * ngnRate;
  const availableUsd = totalUsd - lockedAmount;

  const formatCurrency = (amount: number, currency: string) => {
    if (!showBalance) return "****";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNaira = (amount: number) => {
    if (!showBalance) return "₦****";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDollar = (amount: number) => {
    if (!showBalance) return "₦****";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="balance" className="relative overflow-hidden p-6">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-white/20 p-2">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-white/80">Total Balance</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
            >
              {showBalance ? (
                <EyeOff className="h-5 w-5 text-white/70" />
              ) : (
                <Eye className="h-5 w-5 text-white/70" />
              )}
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              {/* {showBalance ? `$${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$****"} */}
              {showBalance ? formatDollar(totalUsd) : "****"}
            </h2>
            <p className="text-lg text-white/70 mt-1">
              ≈ {formatNaira(totalNgn)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60 mb-1">USDT</p>
              <p className="text-lg font-semibold text-white">
                {showBalance ? formatDollar(usdtBalance) : "****"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">USDC</p>
              <p className="text-lg font-semibold text-white">
                {showBalance ? formatDollar(usdcBalance) : "****"}
              </p>
            </div>
          </div>

          {lockedAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Available</span>
                <span className="text-sm font-medium text-white">
                  {/* ${showBalance ? availableUsd.toFixed(2) : "****"} */}
                  {showBalance ? formatDollar(availableUsd) : "****"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-white/60">In Escrow</span>
                <span className="text-sm font-medium text-warning">
                  {/* ${showBalance ? lockedAmount.toFixed(2) : "****"} */}
                  {showBalance ? formatDollar(lockedAmount) : "****"}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
