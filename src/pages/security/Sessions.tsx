import { Loader2, Monitor, Smartphone, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSecurity } from "@/hooks/useSecurity";

export default function Sessions() {
  const { sessionsQuery, revokeSessionMutation } = useSecurity();

  const revoke = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync({ sessionId });
      toast.success("Session revoked");
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke session");
    }
  };

  return (
    <PageLayout title="Active Sessions" showBack>
      <div className="space-y-3 py-4">
        {sessionsQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : null}

        {!sessionsQuery.isLoading && (sessionsQuery.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No active sessions found.</CardContent>
          </Card>
        ) : null}

        {(sessionsQuery.data ?? []).map((session) => {
          const isMobile = (session.userAgent || "").toLowerCase().includes("mobile");
          return (
            <Card key={session.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-secondary">
                  {isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.deviceName || (isMobile ? "Mobile Device" : "Desktop Device")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{session.ipAddress || "Unknown IP"}</p>
                  <p className="text-xs text-muted-foreground">Last active: {new Date(session.lastActive).toLocaleString()}</p>
                </div>
                {!session.isRevoked ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revoke(session.id)}
                    disabled={revokeSessionMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
