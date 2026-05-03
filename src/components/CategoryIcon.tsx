import { 
  Banknote, 
  Smartphone, 
  Receipt, 
  Zap,
  Tv,
  Wifi,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Clock,
  X,
  LucideIcon
} from "lucide-react";

export type CategoryType = 
  | "groceries" 
  | "airtime" 
  | "electricity" 
  | "cable" 
  | "internet" 
  | "transfer" 
  | "deposit" 
  | "withdrawal";

export type StatusType = "pending" | "confirmed" | "failed";

interface CategoryIconProps {
  category: CategoryType;
  className?: string;
  size?: number;
}

const categoryConfig: Record<CategoryType, { icon: LucideIcon; bgClass: string; iconClass: string }> = {
  groceries: {
    icon: Banknote,
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
  airtime: {
    icon: Smartphone,
    bgClass: "bg-warning/10",
    iconClass: "text-warning",
  },
  electricity: {
    icon: Zap,
    bgClass: "bg-warning/10",
    iconClass: "text-warning",
  },
  cable: {
    icon: Tv,
    bgClass: "bg-pending/10",
    iconClass: "text-pending",
  },
  internet: {
    icon: Wifi,
    bgClass: "bg-success/10",
    iconClass: "text-success",
  },
  transfer: {
    icon: ArrowUpRight,
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
  deposit: {
    icon: ArrowDownLeft,
    bgClass: "bg-success/10",
    iconClass: "text-success",
  },
  withdrawal: {
    icon: ArrowUpRight,
    bgClass: "bg-destructive/10",
    iconClass: "text-destructive",
  },
};

export function CategoryIcon({ category, className = "", size = 20 }: CategoryIconProps) {
  const config = categoryConfig[category] || categoryConfig.transfer;
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-center rounded-xl p-2.5 ${config.bgClass} ${className}`}>
      <Icon size={size} className={config.iconClass} />
    </div>
  );
}

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  /** Compact variant: smaller padding, used inline on narrow screens */
  compact?: boolean;
}

const statusConfig: Record<StatusType, { icon: LucideIcon; bgClass: string; textClass: string; dotClass: string; label: string }> = {
  pending: {
    icon: Clock,
    bgClass: "bg-pending/10",
    textClass: "text-pending",
    dotClass: "bg-pending",
    label: "Pending",
  },
  confirmed: {
    icon: Check,
    bgClass: "bg-success/10",
    textClass: "text-success",
    dotClass: "bg-success",
    label: "Confirmed",
  },
  failed: {
    icon: X,
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    dotClass: "bg-destructive",
    label: "Failed",
  },
};

export function StatusBadge({ status, className = "", compact = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${config.textClass} ${className}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgClass} ${config.textClass} ${className}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </div>
  );
}
