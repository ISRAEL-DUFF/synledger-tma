import { Bell, Wallet, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onWalletClick?: () => void;
}

export function TopBar({ 
  title, 
  onMenuClick, 
  onNotificationClick, 
  onWalletClick 
}: TopBarProps) {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {/* Title / Welcome */}
          <div className="hidden sm:block">
            {title ? (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Good morning</p>
                <h1 className="text-lg font-bold text-foreground">Welcome back! 👋</h1>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button 
            onClick={onNotificationClick}
            className="relative p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          
          {/* Wallet */}
          <button 
            onClick={onWalletClick}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              isConnected 
                ? "bg-primary/10 hover:bg-primary/20" 
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <Wallet className={cn(
              "h-5 w-5",
              isConnected ? "text-primary" : "text-muted-foreground"
            )} />
          </button>

          {/* User Avatar - Desktop only */}
          <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-border">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
