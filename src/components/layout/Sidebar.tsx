import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Grid3X3, 
  History, 
  Settings, 
  Wallet,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  Store,
  BarChart3,
  LogOut
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const mainNavItems = [
  { id: "home", label: "Dashboard", icon: Home, path: "/" },
  { id: "services", label: "Services", icon: Grid3X3, path: "/services" },
  { id: "wallet", label: "Wallet", icon: Wallet, path: "/wallet" },
  { id: "history", label: "Activity", icon: History, path: "/history" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
];

const businessNavItems = [
  { id: "invoices", label: "Invoices", icon: FileText, path: "/invoices" },
  { id: "remittance", label: "Remittance", icon: Send, path: "/remittance" },
  { id: "merchant", label: "Merchant", icon: Store, path: "/merchant" },
];

const bottomNavItems = [
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const NavItem = ({ item, showLabel }: { item: typeof mainNavItems[0]; showLabel: boolean }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-glow" 
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <AnimatePresence mode="wait">
          {showLabel && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      className="hidden lg:flex flex-col h-screen bg-card border-r border-border sticky top-0"
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-foreground">Synledger</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main
            </span>
          )}
          <div className="space-y-1 mt-2">
            {mainNavItems.map((item) => (
              <NavItem key={item.id} item={item} showLabel={!collapsed} />
            ))}
          </div>
        </div>

        {/* Business Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Business
            </span>
          )}
          <div className="space-y-1 mt-2">
            {businessNavItems.map((item) => (
              <NavItem key={item.id} item={item} showLabel={!collapsed} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavItem key={item.id} item={item} showLabel={!collapsed} />
        ))}
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse Button */}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
