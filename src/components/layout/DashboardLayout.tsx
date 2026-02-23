import { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "../BottomNav";
import { NotificationPanel } from "../NotificationPanel";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar (Optional, if still used on desktop browsers) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[100dvh] pt-16">
        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto"
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
