import { motion } from "framer-motion";
import { Gift, Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReferral } from "@/hooks/useReferral";

export default function Referrals() {
  const { summary, invites, isLoading, isError, refetch } = useReferral();
  const botUsername = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined)?.replace(/^@/, "");

  const referralCode = summary?.code || "";
  const signupUrl = referralCode
    ? `https://app.ispend.africa/auth?ref=${encodeURIComponent(referralCode)}&referralCode=${encodeURIComponent(referralCode)}`
    : "https://app.ispend.africa/auth";
  const telegramDeepLink = referralCode && botUsername
    ? `https://t.me/${botUsername}?startapp=${encodeURIComponent(referralCode)}`
    : null;
  const shareTargetUrl = telegramDeepLink || signupUrl;

  const referralText = summary
    ? `Join me on iSpend and get rewarded. Use my referral code: ${summary.code}`
    : "Join me on iSpend and get rewarded.";

  const handleCopyCode = async () => {
    if (!summary?.code) return;
    await navigator.clipboard.writeText(summary.code);
    toast.success("Referral code copied");
  };

  const handleShare = async () => {
    const telegram = (window as any)?.Telegram?.WebApp;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareTargetUrl)}&text=${encodeURIComponent(referralText)}`;

    if (telegram?.openTelegramLink) {
      telegram.openTelegramLink(shareUrl);
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "iSpend Referral",
        text: referralText,
        url: shareTargetUrl,
      });
      return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PageLayout title="Referrals" showBack>
      <div className="space-y-4 py-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-sky-500/20 via-cyan-500/15 to-emerald-500/20 border-sky-500/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Referral Rewards</p>
                <Gift className="h-5 w-5 text-sky-600" />
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading rewards...
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-3xl font-bold">${(summary?.totalEarned ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total earned</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-background/60 p-2">
                      <p className="text-lg font-semibold">{summary?.totalReferrals ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Successful</p>
                    </div>
                    <div className="rounded-lg bg-background/60 p-2">
                      <p className="text-lg font-semibold">{summary?.pendingReferrals ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your referral code</p>
              <p className="font-mono text-xl tracking-widest">{summary?.code ?? "------"}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleCopyCode} disabled={!summary?.code}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button onClick={handleShare} disabled={!summary?.code}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Invites</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>

              {isError ? (
                <p className="text-sm text-destructive">Failed to load referral details.</p>
              ) : null}

              {!isLoading && invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invites yet. Share your code to get started.</p>
              ) : null}

              <div className="space-y-2">
                {invites.map((invite, index) => (
                  <div key={`${invite.username}-${invite.date}-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{invite.username || "New user"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(invite.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={invite.status === "completed" ? "default" : "secondary"}>
                          {invite.status}
                        </Badge>
                        <p className="text-xs mt-1">${Number(invite.reward || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
