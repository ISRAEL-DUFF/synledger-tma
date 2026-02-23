import { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { BottomNav } from "../BottomNav";
import { NotificationPanel } from "../NotificationPanel";
import { useWallet } from "@/hooks/useWallet";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleWalletClick = () => {
    navigate("/wallet");
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          title={title}
          onMenuClick={() => setMobileNavOpen(true)}
          onNotificationClick={() => setShowNotifications(true)}
          onWalletClick={handleWalletClick}
        />

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* Modals */}
      <NotificationPanel open={showNotifications} onOpenChange={setShowNotifications} />
    </div>
  );
}
