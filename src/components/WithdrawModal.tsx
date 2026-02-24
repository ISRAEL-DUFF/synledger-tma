import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowUpRight, Loader2 } from "lucide-react";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    wallets: any[];
}

export function WithdrawModal({ isOpen, onClose, onSuccess, wallets }: WithdrawModalProps) {
    const [targetAddress, setTargetAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedWalletId, setSelectedWalletId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedWallet = wallets.find(w => w.id === selectedWalletId);

    const handleWithdraw = async () => {
        if (!selectedWalletId || !targetAddress || !amount) {
            toast.error("Please fill all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/wallets/withdraw', {
                chain: selectedWallet.chain,
                amount: amount,
                toAddress: targetAddress,
                tokenSymbol: 'USDT'
            });

            toast.success("Withdrawal initiated successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Withdrawal error:", err);
            toast.error(err.message || "Failed to initiate withdrawal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-background border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-primary" />
                        Withdraw Funds
                    </DialogTitle>
                    <DialogDescription>
                        Send tokens from your custodial wallet to an external address.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Source Wallet</Label>
                        <Select onValueChange={setSelectedWalletId} value={selectedWalletId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map(w => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.chain.toUpperCase()} - {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Destination Address</Label>
                        <Input
                            id="address"
                            placeholder="0x... or Solana address"
                            value={targetAddress}
                            onChange={(e) => setTargetAddress(e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USDT)</Label>
                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleWithdraw} disabled={isSubmitting} className="min-w-[140px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            "Withdraw"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
