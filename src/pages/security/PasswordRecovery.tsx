import { useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSecurity } from "@/hooks/useSecurity";

export default function PasswordRecovery() {
  const { user } = useAuth();
  const { forgotPasswordMutation, resetPasswordMutation } = useSecurity();

  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const sendOtp = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      toast.success("Password reset OTP sent");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset OTP");
    }
  };

  const resetPassword = async () => {
    if (!email || !otp || newPassword.length < 6) {
      toast.error("Provide valid email, OTP, and password (min 6 chars)");
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({ email, otp, newPassword });
      toast.success("Password reset successful");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password");
    }
  };

  return (
    <PageLayout title="Password Recovery" showBack>
      <div className="space-y-4 py-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              <p className="font-semibold text-sm">Reset Password via OTP</p>
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className="w-full" onClick={sendOtp} disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send OTP
            </Button>

            <Input placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button className="w-full" onClick={resetPassword} disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Reset Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
