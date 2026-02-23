import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Transaction } from "./TransactionList";
import { CategoryIcon, StatusBadge } from "./CategoryIcon";
import { format } from "date-fns";
import {
    ExternalLink,
    Copy,
    CheckCircle2,
    Clock,
    AlertCircle,
    Hash,
    User,
    ArrowRight,
    Info
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface TransactionDetailsProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
}

export function TransactionDetails({ transaction, isOpen, onClose }: TransactionDetailsProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState<string | null>(null);

    if (!transaction) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        toast({
            description: `${label} copied to clipboard`,
        });
        setTimeout(() => setCopied(null), 2000);
    };

    const formatNaira = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(amount);
    };

    const explorerUrl = transaction.txHash
        ? transaction.chain === 'tron'
            ? `https://tronscan.org/#/transaction/${transaction.txHash}`
            : transaction.chain === 'bsc'
                ? `https://bscscan.com/tx/${transaction.txHash}`
                : `https://arbiscan.io/tx/${transaction.txHash}`
        : null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-4 mb-2">
                        <CategoryIcon category={transaction.category} size={40} />
                        <div className="flex-1 text-left">
                            <DialogTitle className="text-xl">{transaction.description}</DialogTitle>
                            <DialogDescription>
                                {format(new Date(transaction.timestamp), "MMM d, yyyy 'at' h:mm a")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Amount Section */}
                    <div className="text-center p-6 bg-secondary/30 rounded-2xl border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Transaction Amount</p>
                        <h2 className="text-3xl font-bold text-foreground">
                            {formatNaira(transaction.amountNgn)}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            ${transaction.amountUsd.toFixed(2)}
                        </p>
                        <div className="flex justify-center mt-4">
                            <StatusBadge status={transaction.status} />
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>

                        <div className="grid grid-cols-1 gap-4">
                            {transaction.recipient && (
                                <DetailItem
                                    icon={<User className="h-4 w-4" />}
                                    label="Recipient"
                                    value={transaction.recipient}
                                />
                            )}

                            <DetailItem
                                icon={<Clock className="h-4 w-4" />}
                                label="Status"
                                value={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                subValue={transaction.confirmations ? `${transaction.confirmations} confirmations` : undefined}
                            />

                            {transaction.tokenSymbol && (
                                <DetailItem
                                    icon={<Info className="h-4 w-4" />}
                                    label="Paying with"
                                    value={`${transaction.tokenSymbol} on ${transaction.chain || 'Network'}`}
                                />
                            )}

                            {transaction.reference && (
                                <DetailItem
                                    icon={<Hash className="h-4 w-4" />}
                                    label="Reference"
                                    value={transaction.reference}
                                    onCopy={() => copyToClipboard(transaction.reference!, "Reference")}
                                    isCopied={copied === "Reference"}
                                />
                            )}

                            {transaction.txHash && (
                                <DetailItem
                                    icon={<ExternalLink className="h-4 w-4" />}
                                    label="Transaction Hash"
                                    value={`${transaction.txHash.slice(0, 10)}...${transaction.txHash.slice(-8)}`}
                                    onCopy={() => copyToClipboard(transaction.txHash!, "Hash")}
                                    isCopied={copied === "Hash"}
                                    link={explorerUrl}
                                />
                            )}

                            {transaction.failureReason && (
                                <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-destructive uppercase">Failure Reason</p>
                                        <p className="text-sm text-destructive/90">{transaction.failureReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <Button onClick={onClose} className="w-full h-12 rounded-xl text-base font-semibold">
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface DetailItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    onCopy?: () => void;
    isCopied?: boolean;
    link?: string | null;
}

function DetailItem({ icon, label, value, subValue, onCopy, isCopied, link }: DetailItemProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 bg-secondary rounded-lg">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{value}</p>
                    {onCopy && (
                        <button
                            onClick={onCopy}
                            className="p-1 hover:bg-secondary rounded-md transition-colors"
                        >
                            {isCopied ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                        </button>
                    )}
                    {link && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-secondary rounded-md transition-colors"
                        >
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                    )}
                </div>
                {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
            </div>
        </div>
    );
}
