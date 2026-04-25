import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import WebApp from '@twa-dev/sdk';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, login, verifyTwoFactorLogin, pending2FAEmail, signup } = useAuth();
  const [isTelegram] = useState(() => !!WebApp.initData);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [otpStep, setOtpStep] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState(() => searchParams.get("ref") || searchParams.get("referralCode") || "");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStep) {
      if (!pending2FAEmail || !otp) return;
      setIsSubmitting(true);
      try {
        await verifyTwoFactorLogin(pending2FAEmail, otp);
        navigate("/", { replace: true });
      } catch (err: any) {
        toast.error(err?.message || "2FA verification failed");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (result.requires2FA) {
          setOtpStep(true);
          toast.success(`OTP sent to ${result.email}`);
          return;
        }
      } else {
        if (!displayName.trim()) {
          toast.error("Please enter your name");
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, displayName, referralCode || undefined);
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
        <span className="text-primary-foreground font-bold text-3xl">S</span>
      </div>

      {isTelegram ? (
        /* Telegram auto-auth loading state */
        <div className="space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Authenticating...</h1>
          <p className="text-muted-foreground text-sm max-w-[250px]">
            Securely connecting to your iSpend wallet via Telegram.
          </p>
        </div>
      ) : (
        /* Browser login/signup form */
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome to iSpend</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {otpStep
                ? "Enter the OTP sent to your email"
                : mode === "login"
                  ? "Sign in to your account"
                  : "Create a new account"}
            </p>
          </div>

          {/* Tabs */}
          {!otpStep ? (
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && !otpStep && (
              <>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Referral code (optional)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
              </>
            )}

            {otpStep ? (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={pending2FAEmail || ""}
                    className="pl-10"
                    disabled
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10"
                    inputMode="numeric"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
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
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || (otpStep ? !otp : !email || !password)}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {otpStep ? "Verify OTP" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            {otpStep ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOtpStep(false);
                  setOtp("");
                }}
              >
                Back to Login
              </Button>
            ) : null}
          </form>
        </div>
      )}
    </div>
  );
}
