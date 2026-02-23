import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEscrow, EscrowTransaction } from "@/hooks/useEscrow";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/invoiceData";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Lock,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface EscrowManagerProps {
  onClose?: () => void;
}

export const EscrowManager = ({ onClose }: EscrowManagerProps) => {
  const { escrowBalance, transactions, isLoading, getTotalEscrowUSD, depositToEscrow } = useEscrow();
  const { balance: walletBalance, isConnected, shortenedAddress } = useWallet();
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"USDT" | "USDC" | "ETH">("USDT");
  const [showHistory, setShowHistory] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(depositAmount);
    const tokenKey = selectedToken.toLowerCase() as keyof typeof walletBalance;
    
    if (walletBalance[tokenKey] < amount) {
      toast.error(`Insufficient ${selectedToken} balance in wallet`);
      return;
    }

    try {
      const tx = await depositToEscrow(amount, selectedToken);
      if (tx) {
        toast.success(`Successfully deposited ${amount} ${selectedToken} to escrow`);
        setDepositAmount("");
      }
    } catch (error) {
      toast.error("Failed to deposit to escrow");
    }
  };

  const setMaxAmount = () => {
    const tokenKey = selectedToken.toLowerCase() as keyof typeof walletBalance;
    setDepositAmount(walletBalance[tokenKey].toString());
  };

  const getTransactionIcon = (type: EscrowTransaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownToLine className="h-4 w-4 text-green-400" />;
      case 'release':
        return <ArrowUpFromLine className="h-4 w-4 text-blue-400" />;
      case 'refund':
        return <ArrowUpFromLine className="h-4 w-4 text-amber-400" />;
    }
  };

  const getTransactionBadge = (type: EscrowTransaction['type']) => {
    switch (type) {
      case 'deposit':
        return <Badge className="bg-green-500/20 text-green-400">Deposit</Badge>;
      case 'release':
        return <Badge className="bg-blue-500/20 text-blue-400">Release</Badge>;
      case 'refund':
        return <Badge className="bg-amber-500/20 text-amber-400">Refund</Badge>;
    }
  };

  if (!isConnected) {
    return (
      <Card variant="glass" className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Wallet Not Connected</h3>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to manage escrow funds
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Escrow Balance Overview */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Escrow Balance</h3>
        </div>

        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(getTotalEscrowUSD())}
          </p>
          <p className="text-sm text-muted-foreground">Total in Escrow (USD)</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">USDT</p>
            <p className="font-semibold text-foreground">{escrowBalance.usdt.toFixed(2)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">USDC</p>
            <p className="font-semibold text-foreground">{escrowBalance.usdc.toFixed(2)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">ETH</p>
            <p className="font-semibold text-foreground">{escrowBalance.eth.toFixed(4)}</p>
          </div>
        </div>
      </Card>

      {/* Fund Escrow */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownToLine className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-foreground">Fund Escrow</h3>
        </div>

        <div className="space-y-4">
          {/* Wallet Balance */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Wallet</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{shortenedAddress}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-foreground">{walletBalance.usdt.toFixed(2)} USDT</span>
              <span className="text-foreground">{walletBalance.usdc.toFixed(2)} USDC</span>
              <span className="text-foreground">{walletBalance.eth.toFixed(4)} ETH</span>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Select Token</label>
            <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as "USDT" | "USDC" | "ETH")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">USDT (Tether)</SelectItem>
                <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-muted-foreground">Amount</label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto py-0 px-2 text-xs text-primary"
                onClick={setMaxAmount}
              >
                Max
              </Button>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {selectedToken}
              </span>
            </div>
          </div>

          <Button 
            onClick={handleDeposit} 
            disabled={isLoading || !depositAmount}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Deposit to Escrow
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card variant="glass" className="p-4">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Transaction History</h3>
          </div>
          <Badge variant="outline">{transactions.length}</Badge>
        </Button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            {getTransactionBadge(tx.type)}
                            <span className="font-medium text-foreground">
                              {tx.amount} {tx.token}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.timestamp), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        )}
                        {tx.txHash && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => window.open(`https://arbiscan.io/tx/${tx.txHash}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};
