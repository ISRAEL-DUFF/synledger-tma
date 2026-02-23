import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SavedRecipient } from '@/lib/remittanceData';
import { useWallet } from '@/hooks/useWallet';
import { 
  ArrowLeft, 
  ArrowDown, 
  RefreshCw, 
  AlertCircle,
  Info,
  Wallet
} from 'lucide-react';

interface AmountInputProps {
  recipient: SavedRecipient;
  onBack: () => void;
  onContinue: (amount: number, token: 'USDT' | 'USDC', note?: string) => void;
  exchangeRates: { token: 'USDT' | 'USDC'; rate: number }[];
  onRefreshRates: () => void;
  calculateConversion: (amount: number, token: 'USDT' | 'USDC') => {
    amountUsd: number;
    fee: number;
    netAmount: number;
    rate: number;
    amountNgn: number;
    effectiveRate: number;
  };
  validateAmount: (amount: number) => { valid: boolean; error?: string };
  limits: { min: number; max: number };
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export function AmountInput({
  recipient,
  onBack,
  onContinue,
  exchangeRates,
  onRefreshRates,
  calculateConversion,
  validateAmount,
  limits,
}: AmountInputProps) {
  const { balance, isConnected } = useWallet();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'USDT' | 'USDC'>('USDT');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const conversion = calculateConversion(numericAmount, token);
  const currentRate = exchangeRates.find(r => r.token === token)?.rate ?? 0;

  // Available balance for selected token
  const availableBalance = token === 'USDT' ? balance.usdt : balance.usdc;

  useEffect(() => {
    if (numericAmount > 0) {
      const validation = validateAmount(numericAmount);
      if (!validation.valid) {
        setError(validation.error ?? null);
      } else if (isConnected && numericAmount > availableBalance) {
        setError(`Insufficient ${token} balance`);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [numericAmount, token, availableBalance, isConnected, validateAmount]);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleContinue = () => {
    const validation = validateAmount(numericAmount);
    if (!validation.valid) {
      setError(validation.error ?? null);
      return;
    }

    if (isConnected && numericAmount > availableBalance) {
      setError(`Insufficient ${token} balance`);
      return;
    }

    onContinue(numericAmount, token, note || undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Enter Amount</h2>
          <p className="text-sm text-muted-foreground">
            Sending to <span className="text-primary">{recipient.nickname}</span>
          </p>
        </div>
      </div>

      {/* Amount Card */}
      <Card variant="glass" className="p-5 space-y-5">
        {/* You Send */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">You Send</Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-14 text-2xl font-bold"
                inputMode="decimal"
              />
            </div>
            <Select value={token} onValueChange={(v) => setToken(v as 'USDT' | 'USDC')}>
              <SelectTrigger className="w-28 h-14">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Balance indicator */}
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>Balance: {availableBalance.toFixed(2)} {token}</span>
            </div>
          )}

          {/* Quick amounts */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(quickAmount)}
                className={`flex-1 ${
                  amount === quickAmount.toString() 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : ''
                }`}
              >
                ${quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* They Receive */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">They Receive</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshRates}
              className="h-7 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh rate
            </Button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                ₦
              </span>
              <Input
                value={numericAmount > 0 ? conversion.amountNgn.toLocaleString('en-NG', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                }) : ''}
                readOnly
                className="pl-8 h-14 text-2xl font-bold bg-muted/50"
                placeholder="0.00"
              />
            </div>
            <div className="w-28 h-14 rounded-lg bg-muted/50 flex items-center justify-center font-semibold text-muted-foreground">
              NGN
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-semibold text-foreground">
                  1 {token} = ₦{currentRate.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">Fee (1.5%)</span>
                <span className="font-semibold text-foreground">
                  ${conversion.fee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Note */}
      <Card variant="elevated" className="p-4">
        <Label htmlFor="note" className="text-sm text-muted-foreground mb-2 block">
          Add a note (optional)
        </Label>
        <Textarea
          id="note"
          placeholder="e.g., For school fees, Happy Birthday..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </Card>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {/* Limits Info */}
      <p className="text-xs text-muted-foreground text-center">
        Min: ${limits.min} • Max: ${limits.max.toLocaleString()} per transfer
      </p>

      {/* Continue Button */}
      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={handleContinue}
        disabled={!numericAmount || !!error}
      >
        Review Transfer
      </Button>
    </motion.div>
  );
}
