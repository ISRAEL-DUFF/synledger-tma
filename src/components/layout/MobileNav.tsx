import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Grid3X3, 
  History, 
  Settings, 
  Wallet,
  FileText,
  Send,
  Store,
  BarChart3,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const allNavItems = [
  { id: "home", label: "Dashboard", icon: Home, path: "/", category: "Main" },
  { id: "services", label: "Services", icon: Grid3X3, path: "/services", category: "Main" },
  { id: "wallet", label: "Wallet", icon: Wallet, path: "/wallet", category: "Main" },
  { id: "history", label: "Activity", icon: History, path: "/history", category: "Main" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics", category: "Main" },
  { id: "invoices", label: "Invoices", icon: FileText, path: "/invoices", category: "Business" },
  { id: "remittance", label: "Remittance", icon: Send, path: "/remittance", category: "Business" },
  { id: "merchant", label: "Merchant", icon: Store, path: "/merchant", category: "Business" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings", category: "Settings" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const categories = ["Main", "Business", "Settings"];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
          />
          
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-foreground">Synledger</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
              {categories.map((category) => (
                <div key={category} className="space-y-1">
                  <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </span>
                  <div className="space-y-1 mt-2">
                    {allNavItems
                      .filter((item) => item.category === category)
                      .map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.path)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
