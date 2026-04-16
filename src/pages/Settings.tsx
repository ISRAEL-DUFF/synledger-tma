import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  User, Wallet, Bell, Shield, Heart, HelpCircle,
  ChevronRight, LogOut, Globe, Moon, Smartphone, Landmark,
  Mail, Lock, Loader2, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { isConnected, shortenedAddress, disconnect } = useWallet();
  const { user, isTelegram, setCredentials } = useAuth();

  // Set-credentials form state
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credConfirm, setCredConfirm] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const hasEmail = !!user?.email;

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credEmail || !credPassword) return;
    if (credPassword !== credConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (credPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCredSubmitting(true);
    try {
      await setCredentials(credEmail, credPassword);
      toast.success("Login credentials set! You can now sign into the mobile app.");
      setCredEmail("");
      setCredPassword("");
      setCredConfirm("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to set credentials");
    } finally {
      setCredSubmitting(false);
    }
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Manage your profile" },
        {
          icon: Wallet,
          label: "Connected Wallet",
          description: isConnected ? shortenedAddress : "Not connected",
          highlight: !isConnected,
        },
        { icon: Landmark, label: "Withdrawal Addresses", description: "Saved wallets for on-ramp" },
        { icon: Heart, label: "Saved Recipients", description: "5 saved accounts" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Globe, label: "Default Token", description: "USDT" },
        { icon: Bell, label: "Notifications", description: "Email & Push enabled" },
        { icon: Moon, label: "Appearance", description: "System default" },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Shield, label: "KYC Verification", description: "Verify your identity" },
        { icon: Shield, label: "2FA Authentication", description: "Enabled" },
        { icon: Smartphone, label: "Biometrics", description: "Face ID enabled" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & Support", description: "Get help" },
      ],
    },
  ];

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <PageLayout>
      <div className="py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Settings</h1>
        </motion.div>



        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">{section.title}</h3>
            <Card variant="elevated">
              <CardContent className="p-0 divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.label === "Withdrawal Addresses") {
                        navigate("/withdrawal-addresses");
                        return;
                      }
                      if (item.label === "Profile") {
                        navigate("/kyc");
                        return;
                      }
                      if (item.label === "KYC Verification") {
                        navigate("/kyc");
                        return;
                      }
                      toast.info(`${item.label} settings coming soon`);
                    }}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors ${item.highlight ? "bg-primary/5" : ""
                      }`}
                  >
                    <div className={`p-2 rounded-xl ${item.highlight ? "bg-primary/10" : "bg-secondary"}`}>
                      <item.icon className={`h-5 w-5 ${item.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Set Credentials Card — shown only for Telegram-first users without email */}
        {isTelegram && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Mobile App Access</h3>
            <Card variant="elevated">
              <CardContent className="p-5">
                {hasEmail ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Linked to mobile app</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-sm">Set Up Login Credentials</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add an email and password so you can also sign in from the iSpend mobile app.
                      </p>
                    </div>
                    <form onSubmit={handleSetCredentials} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={credEmail}
                          onChange={(e) => setCredEmail(e.target.value)}
                          className="pl-10 h-9 text-sm"
                          autoComplete="email"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password (min 6 chars)"
                          value={credPassword}
                          onChange={(e) => setCredPassword(e.target.value)}
                          className="pl-10 h-9 text-sm"
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={credConfirm}
                          onChange={(e) => setCredConfirm(e.target.value)}
                          className="pl-10 h-9 text-sm"
                          autoComplete="new-password"
                        />
                      </div>
                      <Button type="submit" size="sm" className="w-full" disabled={credSubmitting || !credEmail || !credPassword || !credConfirm}>
                        {credSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Set Credentials
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDisconnect}
            disabled={!isConnected}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isConnected ? "Disconnect Wallet" : "No Wallet Connected"}
          </Button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">iSpend v1.0.0</p>
      </div>
    </PageLayout>
  );
}
