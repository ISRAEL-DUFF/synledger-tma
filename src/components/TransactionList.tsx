import { motion } from "framer-motion";
import { CategoryIcon, CategoryType, StatusBadge, StatusType } from "./CategoryIcon";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

export interface Transaction {
  id: string;
  category: CategoryType;
  description: string;
  amountNgn: number;
  amountUsd: number;
  status: StatusType;
  timestamp: Date | string;
  txHash?: string;
  recipient?: string;
  type?: string;
  processorTxId?: string;
  chain?: string;
  tokenSymbol?: string;
  confirmations?: number;
  failureReason?: string;
  reference?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
      onClick={() => onClick?.(transaction)}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-colors group"
    >
      <div className="shrink-0 scale-90 sm:scale-100">
        <CategoryIcon category={transaction.category} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm sm:text-base text-foreground truncate">
          {transaction.description}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
        </p>
      </div>

      <div className="flex flex-row items-center gap-3 shrink-0">
        <div className="text-right flex flex-col items-end">
          <p className="font-semibold text-sm sm:text-base text-foreground">
            {formatNaira(transaction.amountNgn)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            ${transaction.amountUsd.toFixed(2)}
          </p>
        </div>

        <div className="hidden xs:block shrink-0">
          <StatusBadge status={transaction.status} />
        </div>

        {transaction.txHash && (
          <a
            href={`https://arbiscan.io/tx/${transaction.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  title = "Recent Transactions",
  showViewAll = false,
  onViewAll,
  onTransactionClick
}: TransactionListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary font-medium hover:underline"
          >
            View All
          </button>
        )}
      </div>

      <div className="space-y-1">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TransactionItem
                transaction={transaction}
                onClick={onTransactionClick}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
