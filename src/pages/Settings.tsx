import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  User,
  Wallet,
  Bell,
  Shield,
  Heart,
  HelpCircle,
  ChevronRight,
  LogOut,
  Globe,
  Moon,
  Smartphone,
  Landmark,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  Link2,
  MessageCircle,
  Phone,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type ChainOption =
  | "arbitrum"
  | "base"
  | "bsc"
  | "polygon"
  | "ethereum"
  | "solana"
  | "tron";

type TokenOption = "USDT" | "USDC";

interface SupportContact {
  email: string;
  whatsapp: string;
  phone: string;
  twitter: string;
  businessHours: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { isConnected, shortenedAddress, disconnect } = useWallet();
  const { user, isTelegram, setCredentials, linkTelegram, refreshUser } = useAuth();

  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credConfirm, setCredConfirm] = useState("");
  const [credSubmitting, setCredSubmitting] = useState(false);
  const hasEmail = !!user?.email;

  const [walletPrefOpen, setWalletPrefOpen] = useState(false);
  const [prefSubmitting, setPrefSubmitting] = useState(false);
  const [preferredChain, setPreferredChain] = useState<ChainOption>("arbitrum");
  const [preferredToken, setPreferredToken] = useState<TokenOption>("USDT");

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [support, setSupport] = useState<SupportContact | null>(null);

  useEffect(() => {
    if (!user) return;
    const chain = (user.preferredChain || "arbitrum") as ChainOption;
    const token = (user.preferredToken || "USDT") as TokenOption;
    setPreferredChain(chain);
    setPreferredToken(token);
  }, [user]);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkPassword) return;
    setLinkSubmitting(true);
    try {
      await linkTelegram(linkEmail, linkPassword);
      toast.success("Account linked! Your mobile wallet is now accessible here.");
      setLinkEmail("");
      setLinkPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to link account");
    } finally {
      setLinkSubmitting(false);
    }
  };

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

  const handleSaveWalletPreference = async () => {
    setPrefSubmitting(true);
    try {
      await api.patch("/users/me/wallet-preference", {
        preferredChain,
        preferredToken,
      });
      await refreshUser();
      toast.success("Wallet preference updated");
      setWalletPrefOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update wallet preference");
    } finally {
      setPrefSubmitting(false);
    }
  };

  const openSupport = async () => {
    setSupportOpen(true);
    if (support) return;
    setSupportLoading(true);
    try {
      const res = await api.get<SupportContact>("/support/contact");
      setSupport(res);
    } catch (err) {
      toast.error("Failed to load support details");
    } finally {
      setSupportLoading(false);
    }
  };

  const walletDescription = `${user?.preferredToken || preferredToken} on ${user?.preferredChain || preferredChain}`;

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
        { icon: Globe, label: "Default Token", description: walletDescription },
        { icon: Bell, label: "Notifications", description: "Synced with app notifications" },
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
        { icon: HelpCircle, label: "Help & Support", description: support?.email || "Get help" },
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
                      if (item.label === "Default Token") {
                        setWalletPrefOpen(true);
                        return;
                      }
                      if (item.label === "Help & Support") {
                        openSupport();
                        return;
                      }
                      toast.info(`${item.label} settings coming soon`);
                    }}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors ${item.highlight ? "bg-primary/5" : ""}`}
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

        <Dialog open={walletPrefOpen} onOpenChange={setWalletPrefOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Preference</DialogTitle>
              <DialogDescription>Set your default token and chain for app flows.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Preferred Chain</p>
                <Select value={preferredChain} onValueChange={(v) => setPreferredChain(v as ChainOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="tron">Tron</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Preferred Token</p>
                <Select value={preferredToken} onValueChange={(v) => setPreferredToken(v as TokenOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleSaveWalletPreference} disabled={prefSubmitting}>
                {prefSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Preference
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Help & Support</DialogTitle>
              <DialogDescription>Contact support directly from this app.</DialogDescription>
            </DialogHeader>

            {supportLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : support ? (
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`mailto:${support.email}`, "_blank")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{support.email}</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => window.open(`https://wa.me/${support.whatsapp.replace(/[^\d]/g, "")}`, "_blank")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{support.whatsapp}</p>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => window.open(`tel:${support.phone}`, "_blank")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{support.phone}</p>
                    <p className="text-xs text-muted-foreground">Phone</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => window.open(support.twitter, "_blank")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Twitter</p>
                    <p className="text-xs text-muted-foreground">{support.twitter}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Business hours: {support.businessHours}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to load support details.</p>
            )}
          </DialogContent>
        </Dialog>

        {isTelegram && !hasEmail && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Link Existing Account</h3>
            <Card variant="elevated">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Already use iSpend mobile?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Link your mobile account to access the same wallet and transaction history here.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleLinkAccount} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Mobile app email"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="pl-10 h-9 text-sm"
                        autoComplete="email"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Mobile app password"
                        value={linkPassword}
                        onChange={(e) => setLinkPassword(e.target.value)}
                        className="pl-10 h-9 text-sm"
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full" disabled={linkSubmitting || !linkEmail || !linkPassword}>
                      {linkSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                      Link Account
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
