import { motion } from "framer-motion";
import { LucideIcon, Banknote, Smartphone, Receipt, ArrowDownLeft, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    id: "pay-vendor",
    label: "Pay Vendor",
    icon: Banknote,
    path: "/pay-vendor",
    gradient: "from-primary to-primary/80",
  },
  {
    id: "buy-airtime",
    label: "Airtime",
    icon: Smartphone,
    path: "/buy-airtime",
    gradient: "from-warning to-warning/80",
  },
  {
    id: "pay-bills",
    label: "Pay Bills",
    icon: Receipt,
    path: "/pay-bills",
    gradient: "from-pending to-pending/80",
  },
  {
    id: "deposit",
    label: "Deposit",
    icon: ArrowDownLeft,
    path: "/deposit",
    gradient: "from-success to-success/80",
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  
  // Show first 3 actions + "More" button
  const displayActions = quickActions.slice(0, 3);

  return (
    <div className="grid grid-cols-4 gap-3">
      {displayActions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-card group-hover:shadow-elevated transition-all duration-200 group-active:scale-95`}>
            <action.icon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </motion.button>
      ))}
      
      {/* More button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        onClick={() => navigate("/services")}
        className="flex flex-col items-center gap-2 group"
      >
        <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center group-hover:bg-muted transition-all duration-200 group-active:scale-95">
          <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">More</span>
      </motion.button>
    </div>
  );
}
