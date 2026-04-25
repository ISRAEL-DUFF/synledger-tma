import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSecurity } from "@/hooks/useSecurity";

export default function TwoFactor() {
  const { user } = useAuth();
  const { enableTwoFactorMutation, verifyTwoFactorMutation, disableTwoFactorMutation } = useSecurity();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const email = user?.email || "";

  const enable = async () => {
    try {
      await enableTwoFactorMutation.mutateAsync();
      toast.success("OTP sent. Enter it below to verify 2FA.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to enable 2FA");
    }
  };

  const verify = async () => {
    if (!email) {
      toast.error("Email is required for 2FA verification");
      return;
    }
    try {
      await verifyTwoFactorMutation.mutateAsync({ email, otp });
      toast.success("2FA verified successfully");
      setOtp("");
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP");
    }
  };

  const disable = async () => {
    if (!password) {
      toast.error("Password is required to disable 2FA");
      return;
    }
    try {
      await disableTwoFactorMutation.mutateAsync({ password });
      toast.success("2FA disabled");
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to disable 2FA");
    }
  };

  return (
    <PageLayout title="Two-Factor Auth" showBack>
      <div className="space-y-4 py-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <p className="font-semibold text-sm">Enable 2FA</p>
            </div>
            <p className="text-xs text-muted-foreground">We will send an OTP to your email for verification.</p>
            <Button className="w-full" onClick={enable} disabled={enableTwoFactorMutation.isPending}>
              {enableTwoFactorMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send OTP
            </Button>
            <Input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button className="w-full" onClick={verify} disabled={verifyTwoFactorMutation.isPending}>
              {verifyTwoFactorMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Verify OTP
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold text-sm">Disable 2FA</p>
            <Input
              type="password"
              placeholder="Confirm account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="outline" className="w-full" onClick={disable} disabled={disableTwoFactorMutation.isPending}>
              {disableTwoFactorMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Disable 2FA
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
