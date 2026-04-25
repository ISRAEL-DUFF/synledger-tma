import { Shield, KeyRound, Smartphone, LockKeyhole, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    icon: KeyRound,
    label: "Transaction PIN",
    description: "Set, change, or recover your PIN",
    path: "/security/pin",
  },
  {
    icon: Shield,
    label: "Two-Factor Authentication",
    description: "Enable and manage 2FA",
    path: "/security/2fa",
  },
  {
    icon: Smartphone,
    label: "Active Sessions",
    description: "View and revoke active logins",
    path: "/security/sessions",
  },
  {
    icon: LockKeyhole,
    label: "Password Recovery",
    description: "Reset your password with OTP",
    path: "/security/password-recovery",
  },
];

export default function Security() {
  const navigate = useNavigate();

  return (
    <PageLayout title="Security" showBack>
      <div className="space-y-4 py-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.label}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <div className="p-2 rounded-xl bg-secondary">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}
