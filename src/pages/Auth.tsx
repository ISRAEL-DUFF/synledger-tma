import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import WebApp from '@twa-dev/sdk';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, login, signup } = useAuth();
  const [isTelegram] = useState(() => !!WebApp.initData);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          toast.error("Please enter your name");
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, displayName);
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
              {mode === "login" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          {/* Tabs */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
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
            )}

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

            <Button type="submit" className="w-full" disabled={isSubmitting || !email || !password}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
