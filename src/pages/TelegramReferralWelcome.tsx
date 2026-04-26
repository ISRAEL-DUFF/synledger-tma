import { Gift, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function TelegramReferralWelcome() {
  const navigate = useNavigate();
  const { telegramReferralOnboarding, completeTelegramReferralOnboarding } = useAuth();

  const continueToApp = () => {
    completeTelegramReferralOnboarding();
    navigate("/", { replace: true });
  };

  return (
    <PageLayout title="Welcome" showBack={false}>
      <div className="space-y-4 py-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-sky-500/20 via-cyan-500/15 to-emerald-500/20 border-sky-500/30">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-background/70 mx-auto flex items-center justify-center">
                <Gift className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome to iSpend</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  You joined through a referral invite. Your invite code has been captured and will be applied to your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Referral code applied</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Code: <span className="font-mono">{telegramReferralOnboarding?.referralCode || "N/A"}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>1. Explore the mini app and finish setting up your account.</p>
                <p>2. Set your transaction PIN to protect payments and withdrawals.</p>
                <p>3. When you complete your first eligible transaction, the referral reward flow will kick in automatically.</p>
              </div>

              <Button className="w-full" onClick={continueToApp}>
                Continue to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
