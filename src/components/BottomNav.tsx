import { motion } from "framer-motion";
import { Home, Grid3X3, History, Settings, Wallet } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "services", label: "Services", icon: Grid3X3, path: "/services" },
  { id: "history", label: "Activity", icon: History, path: "/history" },
  { id: "wallet", label: "Wallet", icon: Wallet, path: "/wallet" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-pb"
    >
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <item.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
