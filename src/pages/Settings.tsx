import { useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import {
  User, Wallet, Bell, Shield, Heart, HelpCircle,
  ChevronRight, LogOut, Globe, Moon, Smartphone, Link2
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { isConnected, shortenedAddress, walletType, disconnect } = useWallet();

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
                    onClick={() => toast.info(`${item.label} settings coming soon`)}
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

        <p className="text-center text-xs text-muted-foreground">Synledger v1.0.0</p>
      </div>
    </PageLayout>
  );
}
