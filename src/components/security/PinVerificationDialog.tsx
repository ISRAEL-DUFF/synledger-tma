import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSecurity } from "@/hooks/useSecurity";

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function PinVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  title = "Verify Transaction PIN",
  description = "Enter your 4-6 digit PIN to continue.",
}: PinVerificationDialogProps) {
  const [pin, setPin] = useState("");
  const { verifyPinMutation } = useSecurity();

  useEffect(() => {
    if (!open) {
      setPin("");
    }
  }, [open]);

  const handleVerify = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("PIN must be 4-6 digits");
      return;
    }

    try {
      const ok = await verifyPinMutation.mutateAsync(pin);
      if (!ok) {
        toast.error("Invalid transaction PIN");
        return;
      }
      toast.success("PIN verified");
      onOpenChange(false);
      onVerified();
    } catch (err: any) {
      toast.error(err?.message || "PIN verification failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center tracking-[0.5em]"
          />

          <Button className="w-full" onClick={handleVerify} disabled={verifyPinMutation.isPending}>
            {verifyPinMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Verify PIN
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
