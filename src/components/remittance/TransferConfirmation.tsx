import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SavedRecipient } from '@/lib/remittanceData';
import { 
  ArrowLeft, 
  Building2, 
  User,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';

interface TransferConfirmationProps {
  recipient: SavedRecipient;
  amount: number;
  token: 'USDT' | 'USDC';
  note?: string;
  conversion: {
    amountUsd: number;
    fee: number;
    netAmount: number;
    rate: number;
    amountNgn: number;
    effectiveRate: number;
  };
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function TransferConfirmation({
  recipient,
  amount,
  token,
  note,
  conversion,
  onBack,
  onConfirm,
  isProcessing,
}: TransferConfirmationProps) {
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
          disabled={isProcessing}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Confirm Transfer</h2>
          <p className="text-sm text-muted-foreground">Review details before sending</p>
        </div>
      </div>

      {/* Transfer Summary Card */}
      <Card variant="glass" className="overflow-hidden">
        {/* Amount Section */}
        <div className="p-6 text-center bg-gradient-to-br from-primary/10 to-accent/5">
          <p className="text-sm text-muted-foreground mb-1">Sending</p>
          <p className="text-4xl font-bold text-foreground">
            ${amount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{token}</p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <ArrowRight className="h-5 w-5 text-primary-foreground rotate-90" />
          </div>
        </div>

        {/* Recipient Section */}
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">They receive</p>
          <p className="text-4xl font-bold text-foreground">
            ₦{conversion.amountNgn.toLocaleString('en-NG', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </p>
          <p className="text-sm text-success mt-1 font-medium">
            @ ₦{conversion.rate.toLocaleString()}/{token}
          </p>
        </div>
      </Card>

      {/* Recipient Details */}
      <Card variant="elevated" className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recipient</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{recipient.fullName}</p>
              <p className="text-sm text-muted-foreground">{recipient.nickname}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{recipient.bankName}</p>
              <p className="text-sm text-muted-foreground">{recipient.accountNumber}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fee Breakdown */}
      <Card variant="elevated" className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Fee Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium text-foreground">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee (1.5%)</span>
            <span className="font-medium text-foreground">-${conversion.fee.toFixed(2)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-border flex justify-between">
            <span className="text-foreground font-medium">Total to convert</span>
            <span className="font-bold text-foreground">${conversion.netAmount.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Note if provided */}
      {note && (
        <Card variant="elevated" className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Note</h3>
          <p className="text-sm text-foreground">{note}</p>
        </Card>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-success" />
        <span>Secured by blockchain</span>
      </div>

      {/* Estimated Time */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Estimated delivery: Under 5 minutes</span>
      </div>

      {/* Confirm Button */}
      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={onConfirm}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Confirm & Send ${amount.toLocaleString()}
          </>
        )}
      </Button>
    </motion.div>
  );
}
