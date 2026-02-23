import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RemittanceTransaction } from '@/lib/remittanceData';
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Home,
  Send,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TransferSuccessProps {
  transaction: RemittanceTransaction;
  onNewTransfer: () => void;
  onGoHome: () => void;
}

export function TransferSuccess({
  transaction,
  onNewTransfer,
  onGoHome,
}: TransferSuccessProps) {
  const { toast } = useToast();

  const handleCopyTxId = () => {
    navigator.clipboard.writeText(transaction.id);
    toast({
      title: 'Copied!',
      description: 'Transaction ID copied to clipboard',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Success Animation */}
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
          </motion.div>
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Transfer Initiated!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground"
        >
          Your money is on its way to {transaction.recipientName}
        </motion.p>
      </div>

      {/* Transfer Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card variant="glass" className="p-5 space-y-4">
          {/* Amount Summary */}
          <div className="text-center pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground">Amount sent</p>
            <p className="text-3xl font-bold text-foreground">
              ${transaction.amountUsd.toLocaleString()}
            </p>
            <p className="text-lg font-semibold text-success mt-1">
              ₦{transaction.amountNgn.toLocaleString('en-NG', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-medium text-foreground">{transaction.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium text-foreground">{transaction.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium text-foreground">
                {transaction.accountNumber.slice(-4).padStart(10, '•')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium text-foreground">
                ₦{transaction.exchangeRate.toLocaleString()}/{transaction.token}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee</span>
              <span className="font-medium text-foreground">${transaction.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-foreground">
                {format(transaction.createdAt, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTxId}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
              {transaction.id}
            </p>
          </div>

          {/* Note if provided */}
          {transaction.note && (
            <div className="pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Note</span>
              <p className="text-sm text-foreground mt-1">{transaction.note}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pending/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-pending" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Processing</p>
              <p className="text-sm text-muted-foreground">
                Funds will arrive in under 5 minutes
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* View on Explorer (if txHash exists) */}
      {transaction.txHash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <Button
            variant="link"
            className="text-primary"
            onClick={() => window.open(`https://arbiscan.io/tx/${transaction.txHash}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Arbiscan
          </Button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-2 gap-3"
      >
        <Button
          variant="outline"
          className="h-12"
          onClick={onGoHome}
        >
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
        <Button
          className="h-12"
          onClick={onNewTransfer}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Again
        </Button>
      </motion.div>
    </motion.div>
  );
}
