import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LinkAccount() {
  const navigate = useNavigate();
  const { linkTelegram, skipLinking } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      await linkTelegram(email, password);
      toast.success("Account linked successfully!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to link account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    skipLinking();
    navigate("/", { replace: true });
  };

  return (
    <PageLayout>
      <div className="py-8 space-y-6 max-w-sm mx-auto">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Link2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Link Your Account</h1>
          <p className="text-muted-foreground text-sm">
            Already have an iSpend account from the mobile app? Link it here to
            access the same wallet and transaction history.
          </p>
        </div>

        <Card variant="elevated">
          <CardContent className="p-6">
            <form onSubmit={handleLink} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email from mobile app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !email || !password}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Link Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Skip for now — I'm new here
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
