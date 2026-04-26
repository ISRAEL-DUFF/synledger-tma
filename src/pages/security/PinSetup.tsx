import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSecurity } from "@/hooks/useSecurity";

export default function PinSetup() {
  const { setPinMutation, initiatePinRecoveryMutation, resetPinMutation } = useSecurity();

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [resetPin, setResetPin] = useState("");

  const submitPin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      toast.error("New PIN must be 4-6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    try {
      await setPinMutation.mutateAsync({ pin: newPin, oldPin: oldPin || undefined });
      toast.success("Transaction PIN updated");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to set transaction PIN");
    }
  };

  const sendRecoveryCode = async () => {
    try {
      await initiatePinRecoveryMutation.mutateAsync();
      toast.success("Recovery code sent to your email");
    } catch (err: any) {
      toast.error(err?.message || "Could not send recovery code");
    }
  };

  const submitRecovery = async () => {
    if (!otp.trim() || !/^\d{4,6}$/.test(resetPin)) {
      toast.error("Provide a valid OTP and 4-6 digit PIN");
      return;
    }

    try {
      await resetPinMutation.mutateAsync({ otp: otp.trim(), newPin: resetPin });
      toast.success("Transaction PIN reset successfully");
      setOtp("");
      setResetPin("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset PIN");
    }
  };

  return (
    <PageLayout title="Transaction PIN" showBack>
      <div className="space-y-4 py-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              <p className="font-semibold text-sm">Set or Change PIN</p>
            </div>

            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Current PIN (required if changing)"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="New PIN (4-6 digits)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
            />

            <Button className="w-full" onClick={submitPin} disabled={setPinMutation.isPending}>
              {setPinMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save PIN
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold text-sm">Forgot PIN?</p>
            <p className="text-xs text-muted-foreground">Send a recovery code to your email, then reset your transaction PIN.</p>

            <Button variant="outline" className="w-full" onClick={sendRecoveryCode} disabled={initiatePinRecoveryMutation.isPending}>
              {initiatePinRecoveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send Recovery Code
            </Button>

            <Input
              placeholder="Recovery OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="New PIN"
              value={resetPin}
              onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
            />

            <Button className="w-full" onClick={submitRecovery} disabled={resetPinMutation.isPending}>
              {resetPinMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reset PIN
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
